package workers

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"zimma/internal/enums"
	"zimma/internal/models"

	"github.com/shopspring/decimal"
	"github.com/xuri/excelize/v2"
)

// Itaú exports dates without timezone; they are local to Brazil.
var itauLocation = time.FixedZone("-03", -3*60*60)

// Installment column of the credit card statement, e.g. "Parcela 1 de 4".
var itauCcInstallment = regexp.MustCompile(`(?i)parcela\s+(\d+)\s+de\s+(\d+)`)

// Paying the invoice is already imported from the bank statement.
const itauCcInvoicePayment = "pagamento efetuado"

// ImportFromCcExtractItau reads an Itaú credit card statement (.xlsx) and returns its entries with
// tag suggestions. Every entry is due on the invoice due date, since that is when it is paid.
// ctx must carry the authenticated user so the tag lookups are scoped to them.
func ImportFromCcExtractItau(ctx context.Context, filepath string) ([]ImportedFinancialRecord, error) {
	file, err := excelize.OpenFile(filepath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	sheets := file.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("%s has no sheets", filepath)
	}
	rows, err := file.GetRows(sheets[0], excelize.Options{RawCellValue: true})
	if err != nil {
		return nil, err
	}

	invoiceDueDate, err := findItauCcInvoiceDueDate(rows)
	if err != nil {
		return nil, err
	}

	headerRow, columns := findItauCcEntriesHeader(rows)
	if headerRow < 0 {
		return nil, fmt.Errorf("entries table not found in %s", filepath)
	}

	records := []ImportedFinancialRecord{}
	// Counts identical entries so each one still gets a distinct VendorId.
	occurrences := map[string]int{}
	for i, row := range rows[headerRow+1:] {
		cell := func(column string) string {
			if index, ok := columns[column]; ok && index < len(row) {
				return strings.TrimSpace(row[index])
			}
			return ""
		}

		// The table ends at the first row without a date (the subtotal).
		if cell("data") == "" {
			break
		}
		purchaseDate, err := parseItauCcDate(cell("data"))
		if err != nil {
			return nil, fmt.Errorf("row %d: %w", headerRow+i+2, err)
		}
		amount, err := decimal.NewFromString(cell("valor"))
		if err != nil {
			return nil, fmt.Errorf("row %d: invalid amount %q: %w", headerRow+i+2, cell("valor"), err)
		}

		vendorName := strings.Join(strings.Fields(cell("lancamento")), " ")
		if strings.EqualFold(vendorName, itauCcInvoicePayment) {
			continue
		}

		name := vendorName
		if match := itauCcInstallment.FindStringSubmatch(cell("parcelamento")); match != nil {
			name = fmt.Sprintf("%s %s/%s", name, match[1], match[2])
		}

		// Credits on the invoice (refunds, chargebacks) come with a negative amount.
		recordType := models.FinancialRecordType.EXPENSE
		if amount.IsNegative() {
			recordType = models.FinancialRecordType.INCOME
		}

		key := strings.Join([]string{
			purchaseDate.Format(time.DateOnly), vendorName, cell("parcelamento"), amount.String(), cell("numero do cartao"),
		}, "|")
		occurrences[key]++
		hash := sha1.Sum([]byte(key + "|" + strconv.Itoa(occurrences[key])))

		records = append(records, ImportedFinancialRecord{
			Vendor:        enums.Vendor.ITAU,
			VendorId:      hex.EncodeToString(hash[:]),
			VendorSource:  "cc-extract",
			VendorName:    vendorName,
			Name:          name,
			Amount:        amount.Abs(),
			Type:          recordType,
			DueDate:       invoiceDueDate,
			SuggestedTags: []models.Tag{},
		})
	}

	if err := suggestTags(ctx, records); err != nil {
		return nil, err
	}
	return records, nil
}

// findItauCcInvoiceDueDate reads the value below the "Vencimento" header of the invoice summary.
func findItauCcInvoiceDueDate(rows [][]string) (time.Time, error) {
	for i, row := range rows {
		for j, value := range row {
			if normalizeForMatch(value) != "vencimento" {
				continue
			}
			if i+1 < len(rows) && j < len(rows[i+1]) {
				return parseItauCcDate(strings.TrimSpace(rows[i+1][j]))
			}
		}
	}
	return time.Time{}, fmt.Errorf("invoice due date (Vencimento) not found")
}

// findItauCcEntriesHeader returns the index of the entries table header and the column index of
// each of its normalized headers ("data", "lancamento", "valor", ...), or -1 when not found.
func findItauCcEntriesHeader(rows [][]string) (int, map[string]int) {
	for i, row := range rows {
		columns := map[string]int{}
		for j, value := range row {
			if header := normalizeForMatch(value); header != "" {
				columns[header] = j
			}
		}
		_, hasDate := columns["data"]
		_, hasName := columns["lancamento"]
		_, hasAmount := columns["valor"]
		if hasDate && hasName && hasAmount {
			return i, columns
		}
	}
	return -1, nil
}

// parseItauCcDate parses a date stored either as an Excel serial number or as "dd/mm/yyyy".
func parseItauCcDate(value string) (time.Time, error) {
	if serial, err := strconv.ParseFloat(value, 64); err == nil {
		date, err := excelize.ExcelDateToTime(serial, false)
		if err != nil {
			return time.Time{}, err
		}
		return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, itauLocation), nil
	}
	date, err := time.ParseInLocation("02/01/2006", value, itauLocation)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid date %q", value)
	}
	return date, nil
}

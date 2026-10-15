package workers

import (
	"context"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"

	"zimma/internal/enums"
	"zimma/internal/models"

	"golang.org/x/text/encoding/charmap"
)

// Nubank's invoice closes 7 days before its due date, and the OFX only carries the closing date
// (DTEND of the transaction list).
const nubankDaysFromClosingToDue = 7

// Installments come as "Leroy Merlin - Parcela 1/6".
var nubankInstallment = regexp.MustCompile(`(?i)\s*-?\s*parcela\s+(\d+)\s*/\s*(\d+)\s*$`)

// Credit entry of the payment of a previous invoice.
const nubankInvoicePayment = "pagamento recebido"

var errNubankClosingDateNotFound = errors.New("nubank invoice closing date not found")

// ImportFromCcExtractNubank reads a Nubank credit card invoice (OFX) and returns its entries with
// tag suggestions. ctx must carry the authenticated user so the tag lookups are scoped to them.
func ImportFromCcExtractNubank(ctx context.Context, filepath string) ([]ImportedFinancialRecord, error) {
	content, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	records, err := parseNubankCcInvoice(content)
	if err != nil {
		return nil, err
	}

	if err := suggestTags(ctx, records); err != nil {
		return nil, err
	}
	if err := markAlreadyImported(ctx, records); err != nil {
		return nil, err
	}
	return records, nil
}

// parseNubankCcInvoice converts the OFX content into records, without touching the database.
func parseNubankCcInvoice(content []byte) ([]ImportedFinancialRecord, error) {
	// Nubank exports OFX declaring CHARSET 1252.
	decoded, err := charmap.Windows1252.NewDecoder().Bytes(content)
	if err != nil {
		return nil, err
	}
	text := string(decoded)

	closing := ofxTagValue(text, "DTEND")
	if closing == "" {
		closing = ofxTagValue(text, "DTASOF")
	}
	if closing == "" {
		return nil, errNubankClosingDateNotFound
	}
	closingDate, err := parseOfxDate(closing)
	if err != nil {
		return nil, err
	}
	dueDate := closingDate.AddDate(0, 0, nubankDaysFromClosingToDue)

	transactions, err := parseOfxTransactions(text)
	if err != nil {
		return nil, err
	}

	records := make([]ImportedFinancialRecord, 0, len(transactions))
	for _, trn := range transactions {
		// Purchases are DEBIT with a negative amount; payments and refunds are CREDIT.
		record, err := trn.toImportedFinancialRecord(enums.Vendor.NUBANK, ImportSourceNubankCcExtract)
		if err != nil {
			return nil, fmt.Errorf("transaction %s: %w", trn["FITID"], err)
		}

		vendorName := collapseSpaces(record.VendorName)
		if record.Type == models.FinancialRecordType.INCOME && strings.EqualFold(vendorName, nubankInvoicePayment) {
			continue
		}

		name := vendorName
		if match := nubankInstallment.FindStringSubmatch(vendorName); match != nil {
			vendorName = strings.TrimSpace(nubankInstallment.ReplaceAllString(vendorName, ""))
			name = fmt.Sprintf("%s %s/%s", vendorName, match[1], match[2])
		}

		record.VendorName = vendorName
		record.Name = name
		record.PurchaseDate = record.DueDate
		record.DueDate = dueDate
		records = append(records, record)
	}
	return records, nil
}

// ofxTagValue returns the value of the first occurrence of a leaf tag, e.g. <DTEND>20241218.
func ofxTagValue(content string, tag string) string {
	upper := strings.ToUpper(content)
	start := strings.Index(upper, "<"+tag+">")
	if start < 0 {
		return ""
	}
	value := content[start+len(tag)+2:]
	if end := strings.Index(value, "<"); end >= 0 {
		value = value[:end]
	}
	return strings.TrimSpace(value)
}

// isNubankCcInvoice tells whether the OFX content is a Nubank credit card statement.
func isNubankCcInvoice(upper string) bool {
	return strings.Contains(upper, "<CCSTMTRS>") &&
		(strings.Contains(upper, "NU PAGAMENTOS") || ofxTagValue(upper, "FID") == "260")
}

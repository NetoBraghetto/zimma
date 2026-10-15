package workers

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"zimma/internal/enums"
	"zimma/internal/models"

	"github.com/ledongthuc/pdf"
	"github.com/shopspring/decimal"
)

var interLocation = time.FixedZone("-03", -3*60*60)

var (
	// Page header repeated on the invoice pages: "5555****9760 10/12/2025 R$ 350,55".
	interCcHeaderDueDate = regexp.MustCompile(`\d{4}\*{4}\d{4}\s*(\d{2}/\d{2}/\d{4})\s*R\$`)
	interCcDueDateLabel  = regexp.MustCompile(`(?i)data de vencimento`)
	interCcDate          = regexp.MustCompile(`^(\d{1,2}) de ([a-zç]{3})\.? (\d{4})$`)
	interCcCardTitle     = regexp.MustCompile(`^CARTÃO\s+\d{4}\*{4}(\d{4})$`)
	interCcCardTotal     = regexp.MustCompile(`^Total CARTÃO`)
	interCcAmount        = regexp.MustCompile(`^([+-])?\s*R\$\s*([\d.]+,\d{2})$`)
	interCcInstallment   = regexp.MustCompile(`(?i)\(?\s*parcela\s*(\d+)\s*(?:de|/)\s*(\d+)\s*\)?`)
	interCcPayment       = regexp.MustCompile(`(?i)^(pagamento|pagto)\b`)
	anyDate              = regexp.MustCompile(`\d{2}/\d{2}/\d{4}`)
)

var interMonths = map[string]time.Month{
	"jan": time.January, "fev": time.February, "mar": time.March, "abr": time.April,
	"mai": time.May, "jun": time.June, "jul": time.July, "ago": time.August,
	"set": time.September, "out": time.October, "nov": time.November, "dez": time.December,
}

var errInterCcInvoiceNotFound = errors.New("inter credit card invoice not found")

// ImportFromCcExtractInter reads a Banco Inter credit card invoice (PDF) and returns its entries
// with tag suggestions. ctx must carry the authenticated user so the tag lookups are scoped to them.
func ImportFromCcExtractInter(ctx context.Context, filepath string) ([]ImportedFinancialRecord, error) {
	lines, err := readPdfLines(filepath)
	if err != nil {
		return nil, err
	}

	records, err := parseInterCcInvoice(lines)
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

// pdfLine is a line of text with its chunks, each one at the horizontal position it starts.
type pdfLine struct {
	Page   int
	Chunks []pdfChunk
}

type pdfChunk struct {
	X    float64
	Text string
}

func (this pdfLine) Text() string {
	var builder strings.Builder
	for _, chunk := range this.Chunks {
		builder.WriteString(chunk.Text)
	}
	return strings.TrimSpace(builder.String())
}

// Between returns the text of the chunks starting in [from, to).
func (this pdfLine) Between(from, to float64) string {
	var builder strings.Builder
	for _, chunk := range this.Chunks {
		if chunk.X >= from && chunk.X < to {
			builder.WriteString(chunk.Text)
		}
	}
	return collapseSpaces(builder.String())
}

// readPdfLines extracts the text lines of every page in the order they appear on the page.
func readPdfLines(path string) ([]pdfLine, error) {
	file, reader, err := pdf.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	lines := []pdfLine{}
	for pageNumber := 1; pageNumber <= reader.NumPage(); pageNumber++ {
		page := reader.Page(pageNumber)
		if page.V.IsNull() {
			continue
		}
		rows, err := page.GetTextByRow()
		if err != nil {
			return nil, fmt.Errorf("page %d: %w", pageNumber, err)
		}

		pageLines := make([]pdfLine, 0, len(rows))
		positions := make([]int64, 0, len(rows))
		for _, row := range rows {
			line := pdfLine{Page: pageNumber}
			for _, text := range row.Content {
				if text.S == "" {
					continue
				}
				// Characters of the same run share the X of the run start.
				if last := len(line.Chunks) - 1; last >= 0 && line.Chunks[last].X == text.X {
					line.Chunks[last].Text += text.S
				} else {
					line.Chunks = append(line.Chunks, pdfChunk{X: text.X, Text: text.S})
				}
			}
			sort.SliceStable(line.Chunks, func(a, b int) bool { return line.Chunks[a].X < line.Chunks[b].X })
			pageLines = append(pageLines, line)
			positions = append(positions, row.Position)
		}

		// The vertical axis direction depends on how the PDF was generated: sort by position and
		// flip the page when the table header comes after the card total.
		order := make([]int, len(pageLines))
		for i := range order {
			order[i] = i
		}
		sort.SliceStable(order, func(a, b int) bool { return positions[order[a]] < positions[order[b]] })
		sorted := make([]pdfLine, len(order))
		for i, index := range order {
			sorted[i] = pageLines[index]
		}
		if pageReadsBackwards(sorted) {
			for a, b := 0, len(sorted)-1; a < b; a, b = a+1, b-1 {
				sorted[a], sorted[b] = sorted[b], sorted[a]
			}
		}
		lines = append(lines, sorted...)
	}
	return lines, nil
}

func pageReadsBackwards(lines []pdfLine) bool {
	header, total := -1, -1
	for i, line := range lines {
		text := line.Text()
		switch {
		case header < 0 && isInterCcTableHeader(line):
			header = i
		case total < 0 && interCcCardTotal.MatchString(text):
			total = i
		case total < 0 && interCcCardTitle.MatchString(text):
			// The card title comes right before the table header.
			if header >= 0 {
				return true
			}
		}
	}
	return header >= 0 && total >= 0 && total < header
}

type interCcColumns struct {
	description, beneficiary, value float64
}

func isInterCcTableHeader(line pdfLine) bool {
	return len(line.Chunks) >= 3 &&
		strings.TrimSpace(line.Chunks[0].Text) == "Data" &&
		strings.TrimSpace(line.Chunks[len(line.Chunks)-1].Text) == "Valor"
}

// interCcHeaderColumns returns where each column starts, from the table header
// ("Data", "Movimentação", "Beneficiário", "Valor").
func interCcHeaderColumns(line pdfLine) (interCcColumns, bool) {
	columns := interCcColumns{}
	found := 0
	for _, chunk := range line.Chunks {
		switch strings.TrimSpace(chunk.Text) {
		case "Movimentação":
			columns.description = chunk.X
			found++
		case "Beneficiário":
			columns.beneficiary = chunk.X
			found++
		case "Valor":
			columns.value = chunk.X
			found++
		}
	}
	if found != 3 {
		return columns, false
	}
	// Values are right aligned, so they start before their header: split halfway.
	columns.value = (columns.beneficiary + columns.value) / 2
	// Leave a small margin for cells that start slightly before their header.
	columns.description -= 10
	columns.beneficiary -= 10
	return columns, true
}

type interCcEntry struct {
	page         int
	card         string
	purchaseDate time.Time
	description  string
	details      []string
	beneficiary  string
	value        string
}

// parseInterCcInvoice converts the invoice lines into records, without touching the database.
func parseInterCcInvoice(lines []pdfLine) ([]ImportedFinancialRecord, error) {
	dueDate, err := findInterCcDueDate(lines)
	if err != nil {
		return nil, err
	}

	entries := []*interCcEntry{}
	var columns interCcColumns
	var current *interCcEntry
	card := ""
	inTable := false
	foundTable := false

	for _, line := range lines {
		text := line.Text()
		if match := interCcCardTitle.FindStringSubmatch(text); match != nil {
			card = match[1]
			current = nil
			continue
		}
		if isInterCcTableHeader(line) {
			if found, ok := interCcHeaderColumns(line); ok {
				columns = found
				inTable = true
				foundTable = true
			}
			current = nil
			continue
		}
		if interCcCardTotal.MatchString(text) {
			inTable = false
			current = nil
			continue
		}
		if !inTable {
			continue
		}

		date := line.Between(0, columns.description)
		if match := interCcDate.FindStringSubmatch(strings.ToLower(date)); match != nil {
			purchaseDate, err := parseInterCcDate(match)
			if err != nil {
				return nil, err
			}
			current = &interCcEntry{
				page:         line.Page,
				card:         card,
				purchaseDate: purchaseDate,
				description:  line.Between(columns.description, columns.beneficiary),
				beneficiary:  line.Between(columns.beneficiary, columns.value),
				value:        line.Between(columns.value, 1e9),
			}
			entries = append(entries, current)
			continue
		}

		// Extra description lines (e.g. currency conversion) of the last entry. Lines on another
		// page belong to the page header, not to the entry.
		if current != nil && current.page == line.Page {
			if detail := line.Between(columns.description, columns.beneficiary); detail != "" {
				current.details = append(current.details, detail)
			}
		}
	}
	if !foundTable {
		return nil, errInterCcInvoiceNotFound
	}

	records := make([]ImportedFinancialRecord, 0, len(entries))
	// Counts identical entries so each one still gets a distinct VendorId.
	occurrences := map[string]int{}
	for _, entry := range entries {
		match := interCcAmount.FindStringSubmatch(entry.value)
		if match == nil {
			return nil, fmt.Errorf("%s %s: invalid amount %q", entry.purchaseDate.Format(time.DateOnly), entry.description, entry.value)
		}
		amount, err := decimal.NewFromString(strings.ReplaceAll(strings.ReplaceAll(match[2], ".", ""), ",", "."))
		if err != nil {
			return nil, fmt.Errorf("%s %s: invalid amount %q: %w", entry.purchaseDate.Format(time.DateOnly), entry.description, entry.value, err)
		}

		// Charges have no sign; credits (refunds, payments) come with "+".
		recordType := models.FinancialRecordType.EXPENSE
		if match[1] == "+" {
			recordType = models.FinancialRecordType.INCOME
		}

		vendorName := entry.description
		installment := ""
		for _, text := range append([]string{entry.description}, entry.details...) {
			if found := interCcInstallment.FindStringSubmatch(text); found != nil {
				installment = fmt.Sprintf("%s/%s", strings.TrimLeft(found[1], "0"), strings.TrimLeft(found[2], "0"))
				if text == entry.description {
					vendorName = collapseSpaces(strings.Trim(interCcInstallment.ReplaceAllString(text, " "), " -"))
				}
				break
			}
		}

		if recordType == models.FinancialRecordType.INCOME && interCcPayment.MatchString(vendorName) {
			continue
		}

		name := vendorName
		if entry.beneficiary != "" && entry.beneficiary != "-" {
			name = entry.beneficiary
		}
		if installment != "" {
			name = fmt.Sprintf("%s %s", name, installment)
		}

		key := strings.Join([]string{
			entry.purchaseDate.Format(time.DateOnly), vendorName, installment, match[1] + amount.String(), entry.card,
		}, "|")
		occurrences[key]++
		hash := sha1.Sum([]byte(key + "|" + strconv.Itoa(occurrences[key])))

		records = append(records, ImportedFinancialRecord{
			Vendor:        enums.Vendor.INTER,
			VendorId:      hex.EncodeToString(hash[:]),
			VendorSource:  ImportSourceInterCcExtract,
			VendorName:    vendorName,
			Name:          name,
			Amount:        amount,
			Type:          recordType,
			DueDate:       dueDate,
			PurchaseDate:  entry.purchaseDate,
			SuggestedTags: []models.Tag{},
		})
	}
	return records, nil
}

// findInterCcDueDate reads the due date from the page header or, failing that, from the
// "Data de Vencimento" box of the summary.
func findInterCcDueDate(lines []pdfLine) (time.Time, error) {
	for _, line := range lines {
		if match := interCcHeaderDueDate.FindStringSubmatch(line.Text()); match != nil {
			return time.ParseInLocation("02/01/2006", match[1], interLocation)
		}
	}
	for i, line := range lines {
		if !interCcDueDateLabel.MatchString(line.Text()) {
			continue
		}
		for _, candidate := range lines[i:min(i+3, len(lines))] {
			if date := anyDate.FindString(candidate.Text()); date != "" {
				return time.ParseInLocation("02/01/2006", date, interLocation)
			}
		}
	}
	return time.Time{}, errInterCcInvoiceNotFound
}

// parseInterCcDate parses the submatches of dates like "22 de nov. 2025".
func parseInterCcDate(match []string) (time.Time, error) {
	month, ok := interMonths[match[2]]
	if !ok {
		return time.Time{}, fmt.Errorf("invalid month %q", match[2])
	}
	day, _ := strconv.Atoi(match[1])
	year, _ := strconv.Atoi(match[3])
	return time.Date(year, month, day, 0, 0, 0, 0, interLocation), nil
}

// isInterCcInvoice tells whether the PDF is a Banco Inter credit card invoice.
func isInterCcInvoice(path string) bool {
	lines, err := readPdfLines(path)
	if err != nil {
		return false
	}
	_, err = parseInterCcInvoice(lines)
	return err == nil
}

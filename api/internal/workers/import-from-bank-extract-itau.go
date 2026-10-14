package workers

import (
	"context"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"zimma/internal/enums"
	"zimma/internal/models"

	"github.com/shopspring/decimal"
	"golang.org/x/text/encoding/charmap"
)

// Itaú appends the transaction day and month to PIX memos, e.g. "PIX TRANSF RAPHAEL20 09".
var itauMemoDateSuffix = regexp.MustCompile(`\s*\d{2} \d{2}$`)

// ImportFromBankExtractItau reads an Itaú OFX statement and returns its entries with tag suggestions.
// ctx must carry the authenticated user so the tag lookups are scoped to them.
func ImportFromBankExtractItau(ctx context.Context, filepath string) ([]ImportedFinancialRecord, error) {
	content, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}
	// Itaú exports OFX in CHARSET 1252.
	decoded, err := charmap.Windows1252.NewDecoder().Bytes(content)
	if err != nil {
		return nil, err
	}

	transactions, err := parseOfxTransactions(string(decoded))
	if err != nil {
		return nil, err
	}

	records := make([]ImportedFinancialRecord, 0, len(transactions))
	for _, trn := range transactions {
		record, err := trn.toImportedFinancialRecord()
		if err != nil {
			return nil, fmt.Errorf("transaction %s: %w", trn["FITID"], err)
		}
		record.Name = strings.TrimSpace(itauMemoDateSuffix.ReplaceAllString(record.Name, ""))
		records = append(records, record)
	}

	if err := suggestTags(ctx, records); err != nil {
		return nil, err
	}
	if err := markAlreadyImported(ctx, records); err != nil {
		return nil, err
	}
	return records, nil
}

type ofxTransaction map[string]string

// parseOfxTransactions extracts the <STMTTRN> blocks of an OFX file. It accepts both the SGML
// flavour (leaf tags without closing tags) and the XML one.
func parseOfxTransactions(content string) ([]ofxTransaction, error) {
	transactions := []ofxTransaction{}
	var current ofxTransaction

	for _, token := range strings.Split(content, "<")[1:] {
		tag, value, found := strings.Cut(token, ">")
		if !found {
			return nil, fmt.Errorf("invalid OFX tag: <%s", token)
		}
		tag = strings.ToUpper(strings.TrimSpace(tag))
		switch {
		case tag == "STMTTRN":
			current = ofxTransaction{}
		case tag == "/STMTTRN":
			if current != nil {
				transactions = append(transactions, current)
			}
			current = nil
		case current != nil && !strings.HasPrefix(tag, "/"):
			current[tag] = strings.TrimSpace(value)
		}
	}
	return transactions, nil
}

func (this ofxTransaction) toImportedFinancialRecord() (ImportedFinancialRecord, error) {
	amount, err := decimal.NewFromString(strings.ReplaceAll(this["TRNAMT"], ",", "."))
	if err != nil {
		return ImportedFinancialRecord{}, fmt.Errorf("invalid TRNAMT %q: %w", this["TRNAMT"], err)
	}
	dueDate, err := parseOfxDate(this["DTPOSTED"])
	if err != nil {
		return ImportedFinancialRecord{}, err
	}

	recordType := models.FinancialRecordType.INCOME
	if amount.IsNegative() || strings.EqualFold(this["TRNTYPE"], "DEBIT") {
		recordType = models.FinancialRecordType.EXPENSE
	}

	name := this["MEMO"]
	if name == "" {
		name = this["NAME"]
	}

	return ImportedFinancialRecord{
		Vendor:        enums.Vendor.ITAU,
		VendorId:      this["FITID"],
		VendorSource:  ImportSourceItauBankExtract,
		VendorName:    name,
		Name:          name,
		Amount:        amount.Abs(),
		Type:          recordType,
		DueDate:       dueDate,
		SuggestedTags: []models.Tag{},
	}, nil
}

var ofxDateTimezone = regexp.MustCompile(`\[([+-]?\d+(?:\.\d+)?)(?::[^\]]*)?\]`)

// parseOfxDate parses dates like "20260901100000[-03:EST]" or "20260901".
func parseOfxDate(value string) (time.Time, error) {
	location := time.UTC
	if match := ofxDateTimezone.FindStringSubmatch(value); match != nil {
		var hours float64
		fmt.Sscanf(match[1], "%g", &hours)
		location = time.FixedZone("", int(hours*3600))
		value = value[:strings.Index(value, "[")]
	}
	// Drop milliseconds, e.g. "20260901100000.000".
	value, _, _ = strings.Cut(value, ".")

	for _, layout := range []string{"20060102150405", "200601021504", "20060102"} {
		if len(value) == len(layout) {
			return time.ParseInLocation(layout, value, location)
		}
	}
	return time.Time{}, fmt.Errorf("invalid OFX date %q", value)
}

package workers

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"zimma/internal/enums"

	"golang.org/x/text/encoding/charmap"
)

// Inter prefixes the counterparty in PIX memos with its document, e.g.
// `Pix recebido: "Cp :10573521-EMPRESA LTDA"`.
var interMemoCounterparty = regexp.MustCompile(`"?Cp\s*:\s*\d+-`)

// ImportFromBankExtractInter reads a Banco Inter OFX statement and returns its entries with tag suggestions.
// ctx must carry the authenticated user so the tag lookups are scoped to them.
func ImportFromBankExtractInter(ctx context.Context, filepath string) ([]ImportedFinancialRecord, error) {
	content, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	records, err := parseInterBankExtract(content)
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

// parseInterBankExtract converts the OFX content into records, without touching the database.
func parseInterBankExtract(content []byte) ([]ImportedFinancialRecord, error) {
	// Inter exports OFX declaring CHARSET 1252.
	decoded, err := charmap.Windows1252.NewDecoder().Bytes(content)
	if err != nil {
		return nil, err
	}

	transactions, err := parseOfxTransactions(string(decoded))
	if err != nil {
		return nil, err
	}

	records := make([]ImportedFinancialRecord, 0, len(transactions))
	// Counts identical entries so each one still gets a distinct VendorId.
	occurrences := map[string]int{}
	for _, trn := range transactions {
		record, err := trn.toImportedFinancialRecord(enums.Vendor.INTER, ImportSourceInterBankExtract)
		if err != nil {
			return nil, fmt.Errorf("transaction %s: %w", trn["FITID"], err)
		}

		// NAME holds the clean counterparty name; MEMO adds the operation and the counterparty document.
		record.VendorName = collapseSpaces(trn["MEMO"])
		record.Name = collapseSpaces(trn["NAME"])
		if record.Name == "" {
			record.Name = collapseSpaces(strings.ReplaceAll(interMemoCounterparty.ReplaceAllString(trn["MEMO"], ""), `"`, ""))
		}
		if record.VendorName == "" {
			record.VendorName = record.Name
		}

		// Inter's FITID is the date plus a sequence within the day, which changes when the same day is
		// exported with a different set of entries. The content is stable, so the id is derived from it.
		key := strings.Join([]string{
			record.DueDate.Format(time.DateOnly), strconv.Itoa(record.Type), record.Amount.String(), record.VendorName,
		}, "|")
		occurrences[key]++
		hash := sha1.Sum([]byte(key + "|" + strconv.Itoa(occurrences[key])))
		record.VendorId = hex.EncodeToString(hash[:])

		records = append(records, record)
	}
	return records, nil
}

func collapseSpaces(value string) string {
	return strings.Join(strings.Fields(value), " ")
}

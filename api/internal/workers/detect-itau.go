package workers

import (
	"context"
	"errors"
	"os"
	"regexp"
	"strings"

	"zimma/internal/bootstrap"
	"zimma/internal/models"

	"github.com/xuri/excelize/v2"
)

const (
	ImportSourceItauBankExtract  = "itau-bank-extract"
	ImportSourceItauCcExtract    = "itau-cc-extract"
	ImportSourceInterBankExtract = "inter-bank-extract"
	ImportSourceInterCcExtract   = "inter-cc-extract"
	ImportSourceNubankCcExtract  = "nubank-cc-extract"
)

// ImportSourceLabels are the user facing names of the supported statements.
var ImportSourceLabels = map[string]string{
	ImportSourceItauBankExtract:  "Extrato Bancário ITAU",
	ImportSourceItauCcExtract:    "Extrato de Cartão de Crédito ITAU",
	ImportSourceInterBankExtract: "Extrato Bancário INTER",
	ImportSourceInterCcExtract:   "Fatura de Cartão de Crédito INTER",
	ImportSourceNubankCcExtract:  "Fatura de Cartão de Crédito NUBANK",
}

var ErrUnsupportedImportFile = errors.New("unsupported import file")

// Bank codes present in the <BANKID> of the OFX statements, without leading zeros.
const (
	itauBankId  = "341"
	interBankId = "77"
)

var ofxBankIdTag = regexp.MustCompile(`<BANKID>\s*0*(\d+)`)

// DetectImportSource identifies which supported statement the file is by its content, so the
// file extension does not matter.
func DetectImportSource(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}

	upper := strings.ToUpper(string(content))
	if strings.Contains(upper, "<OFX>") {
		if isNubankCcInvoice(upper) {
			return ImportSourceNubankCcExtract, nil
		}
		bankId := ""
		if match := ofxBankIdTag.FindStringSubmatch(upper); match != nil {
			bankId = match[1]
		}
		switch bankId {
		case itauBankId:
			return ImportSourceItauBankExtract, nil
		case interBankId:
			return ImportSourceInterBankExtract, nil
		}
		return "", ErrUnsupportedImportFile
	}

	if strings.HasPrefix(upper, "%PDF") {
		if isInterCcInvoice(path) {
			return ImportSourceInterCcExtract, nil
		}
		return "", ErrUnsupportedImportFile
	}

	file, err := excelize.OpenFile(path)
	if err != nil {
		return "", ErrUnsupportedImportFile
	}
	defer file.Close()

	sheets := file.GetSheetList()
	if len(sheets) == 0 {
		return "", ErrUnsupportedImportFile
	}
	rows, err := file.GetRows(sheets[0], excelize.Options{RawCellValue: true})
	if err != nil {
		return "", ErrUnsupportedImportFile
	}
	if _, err := findItauCcInvoiceDueDate(rows); err != nil {
		return "", ErrUnsupportedImportFile
	}
	if headerRow, _ := findItauCcEntriesHeader(rows); headerRow < 0 {
		return "", ErrUnsupportedImportFile
	}
	return ImportSourceItauCcExtract, nil
}

// Import parses the file with the importer of the given source.
func Import(ctx context.Context, source string, path string) ([]ImportedFinancialRecord, error) {
	records, err := importBySource(ctx, source, path)
	if err != nil {
		return nil, err
	}
	suggestPaymentMethods(source, records)
	return records, nil
}

func importBySource(ctx context.Context, source string, path string) ([]ImportedFinancialRecord, error) {
	switch source {
	case ImportSourceItauBankExtract:
		return ImportFromBankExtractItau(ctx, path)
	case ImportSourceItauCcExtract:
		return ImportFromCcExtractItau(ctx, path)
	case ImportSourceInterBankExtract:
		return ImportFromBankExtractInter(ctx, path)
	case ImportSourceInterCcExtract:
		return ImportFromCcExtractInter(ctx, path)
	case ImportSourceNubankCcExtract:
		return ImportFromCcExtractNubank(ctx, path)
	}
	return nil, ErrUnsupportedImportFile
}

// ExistingVendorIds returns which of the given vendor ids the authenticated user (carried by ctx)
// already imported from the vendor and source.
func ExistingVendorIds(ctx context.Context, vendor string, source string, ids []string) (map[string]bool, error) {
	existing := map[string]bool{}
	if len(ids) == 0 {
		return existing, nil
	}

	var found []string
	err := bootstrap.DB.WithContext(ctx).
		Model(&models.FinancialRecord{}).
		Where("vendor = ? AND vendor_source = ? AND vendor_id IN ?", vendor, source, ids).
		Pluck("vendor_id", &found).Error
	if err != nil {
		return nil, err
	}
	for _, id := range found {
		existing[id] = true
	}
	return existing, nil
}

// markAlreadyImported flags the records the user already imported.
func markAlreadyImported(ctx context.Context, records []ImportedFinancialRecord) error {
	if len(records) == 0 {
		return nil
	}

	ids := make([]string, len(records))
	for i, record := range records {
		ids[i] = record.VendorId
	}
	// All the records of a file share the vendor and source.
	existing, err := ExistingVendorIds(ctx, records[0].Vendor, records[0].VendorSource, ids)
	if err != nil {
		return err
	}
	for i := range records {
		records[i].AlreadyImported = existing[records[i].VendorId]
	}
	return nil
}

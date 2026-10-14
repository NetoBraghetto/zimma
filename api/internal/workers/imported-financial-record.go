package workers

import (
	"context"
	"sort"
	"strings"
	"time"
	"unicode"

	"zimma/internal/bootstrap"
	"zimma/internal/models"

	"github.com/shopspring/decimal"
	"golang.org/x/text/unicode/norm"
)

// ImportedFinancialRecord is a bank or credit card statement entry ready to be reviewed and stored as a FinancialRecord.
type ImportedFinancialRecord struct {
	Vendor string `json:"vendor"`
	// Transaction id given by the vendor (OFX FITID) or derived from the entry when it has none,
	// useful to detect duplicated imports.
	VendorId      string          `json:"vendor_id"`
	VendorSource  string          `json:"vendor_source"`
	VendorName    string          `json:"vendor_name"`
	Name          string          `json:"name"`
	Amount        decimal.Decimal `json:"amount"`
	Type          int             `json:"type"`
	DueDate       time.Time       `json:"due_date"`
	SuggestedTags []models.Tag    `json:"suggested_tags"`
}

// Maximum number of tags suggested for each imported record.
const maxSuggestedTags = 3

// How far back the user's records are used to learn which tags fit a statement entry.
const tagHistoryMonths = 12

// suggestTags ranks the user's tags for each record, preferring the tags used on past records
// with a similar name and falling back to tags whose name appears in the record's name.
func suggestTags(ctx context.Context, records []ImportedFinancialRecord) error {
	if len(records) == 0 {
		return nil
	}

	db := bootstrap.DB.WithContext(ctx)
	var tags []models.Tag
	if err := db.Find(&tags).Error; err != nil {
		return err
	}
	if len(tags) == 0 {
		return nil
	}

	var history []models.FinancialRecord
	err := db.Preload("Tags").
		Where("due_date >= ?", time.Now().AddDate(0, -tagHistoryMonths, 0)).
		Where("EXISTS (SELECT 1 FROM financial_record_tags frt WHERE frt.financial_record_id = financial_record.id)").
		Find(&history).Error
	if err != nil {
		return err
	}

	normalizedHistory := make([]string, len(history))
	for i, record := range history {
		normalizedHistory[i] = normalizeForMatch(record.Name)
	}

	for i := range records {
		name := normalizeForMatch(records[i].Name)
		scores := map[uint64]int{}

		for j, past := range history {
			if past.Type != records[i].Type || !similarNames(name, normalizedHistory[j]) {
				continue
			}
			for _, tag := range past.Tags {
				scores[tag.ID] += 2
			}
		}
		for _, tag := range tags {
			if tagName := normalizeForMatch(tag.Name); tagName != "" && containsWord(name, tagName) {
				scores[tag.ID]++
			}
		}

		suggested := []models.Tag{}
		for _, tag := range tags {
			if scores[tag.ID] > 0 {
				suggested = append(suggested, tag)
			}
		}
		sort.SliceStable(suggested, func(a, b int) bool {
			return scores[suggested[a].ID] > scores[suggested[b].ID]
		})
		if len(suggested) > maxSuggestedTags {
			suggested = suggested[:maxSuggestedTags]
		}
		records[i].SuggestedTags = suggested
	}
	return nil
}

// normalizeForMatch lowercases, strips accents, digits and punctuation, and collapses spaces.
func normalizeForMatch(value string) string {
	var builder strings.Builder
	for _, r := range norm.NFD.String(strings.ToLower(value)) {
		switch {
		case unicode.Is(unicode.Mn, r):
			// Accent marks left by the NFD decomposition.
		case unicode.IsLetter(r):
			builder.WriteRune(r)
		default:
			builder.WriteRune(' ')
		}
	}
	return strings.Join(strings.Fields(builder.String()), " ")
}

func similarNames(a, b string) bool {
	if a == "" || b == "" {
		return false
	}
	return a == b || containsWord(a, b) || containsWord(b, a)
}

func containsWord(text, word string) bool {
	return strings.Contains(" "+text+" ", " "+word+" ")
}

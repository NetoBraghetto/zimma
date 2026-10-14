package services

import (
	"context"
	"errors"
	"time"

	"zimma/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// MaterializeRecurringSeries creates the missing occurrences of RECURRING series due before until.
// A recurring serie has no end, so its occurrences are generated lazily as later months are requested.
func MaterializeRecurringSeries(ctx context.Context, db *gorm.DB, until time.Time) error {
	return db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var series []models.FinancialRecordSerie
		// Locking the series keeps concurrent requests from creating the same occurrence twice.
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("recurrence_id = ? AND start_date < ?", models.FinancialRecordSerieRecurrence.RECURRING, until).
			Find(&series).Error; err != nil {
			return err
		}

		for _, serie := range series {
			// Unscoped so a deleted occurrence is not recreated; new occurrences inherit its tags.
			var last models.FinancialRecord
			err := tx.Unscoped().
				Where("financial_record_serie_id = ?", serie.ID).
				Order("installment DESC").
				Preload("Tags").
				Take(&last).Error
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}

			var occurrences []models.FinancialRecord
			for i := last.Installment; serie.OccurrenceDate(i).Before(until); i++ {
				occurrences = append(occurrences, models.FinancialRecord{
					Name:                   serie.Name,
					Amount:                 serie.OccurrenceAmount(i),
					Type:                   serie.Type,
					DueDate:                serie.OccurrenceDate(i),
					FinancialRecordSerieId: serie.ID,
					Installment:            i + 1,
					Tags:                   last.Tags,
				})
			}
			if len(occurrences) == 0 {
				continue
			}
			// "Tags.*" only links the existing tags instead of upserting them.
			if err := tx.Omit("Tags.*").CreateInBatches(&occurrences, 100).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

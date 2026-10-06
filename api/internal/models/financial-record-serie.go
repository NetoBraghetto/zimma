package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type TFinancialRecordSerieRecurrence = struct {
	UNIQUE    int
	REPEAT    int
	RECURRING int
	SPLITED   int
}

var FinancialRecordSerieRecurrence = &TFinancialRecordSerieRecurrence{
	UNIQUE:    1,
	REPEAT:    2,
	RECURRING: 3,
	SPLITED:   4,
}

type TFinancialRecordSerieInterval = struct {
	DAILY   int
	WEEKLY  int
	MONTHLY int
	YEARLY  int
	CUSTOM  int
}

var FinancialRecordSerieInterval = &TFinancialRecordSerieInterval{
	DAILY:   1,
	WEEKLY:  2,
	MONTHLY: 3,
	YEARLY:  4,
	CUSTOM:  5,
}

type TFinancialRecordSerieType = struct {
	INCOME  int
	EXPENSE int
}

var FinancialRecordSerieType = &TFinancialRecordSerieType{
	INCOME:  1,
	EXPENSE: 2,
}

type FinancialRecordSerie struct {
	ID           uint64          `gorm:"primaryKey" json:"id"`
	Name         string          `gorm:"size:255;not null" json:"name"`
	Amount       decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"amount"`
	Type         int             `gorm:"type:smallint;not null" json:"type"`
	RecurrenceId int             `gorm:"type:smallint;not null" json:"recurrence"`
	IntervalId   *int            `gorm:"type:smallint" json:"interval"`
	IntervalDays *int            `json:"interval_days"`
	RepeatCount  *int            `json:"repeat_count"`
	StartDate    time.Time       `gorm:"not null" json:"start_date"`
	BelongsToUser
	CreatedAt time.Time         `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time         `gorm:"not null" json:"-"`
	DeletedAt gorm.DeletedAt    `json:"-"`
	Records   []FinancialRecord `json:"-"`
}

// OccurrenceAmount returns the amount of the zero-based occurrence i. SPLITED series
// divide Amount across RepeatCount installments, with leftover cents on the first one.
func (this FinancialRecordSerie) OccurrenceAmount(i int) decimal.Decimal {
	if this.RecurrenceId != FinancialRecordSerieRecurrence.SPLITED || this.RepeatCount == nil || *this.RepeatCount < 1 {
		return this.Amount
	}

	total := this.Amount.Round(2)
	count := decimal.NewFromInt(int64(*this.RepeatCount))
	base := total.Div(count).RoundDown(2)
	if i == 0 {
		return total.Sub(base.Mul(count)).Add(base)
	}
	return base
}

// OccurrenceDate returns the due date of the zero-based occurrence i, always
// computed from StartDate so month/year steps never drift (Jan 31 -> Feb 28 -> Mar 31).
func (this FinancialRecordSerie) OccurrenceDate(i int) time.Time {
	if this.IntervalId == nil {
		return this.StartDate
	}
	switch *this.IntervalId {
	case FinancialRecordSerieInterval.DAILY:
		return this.StartDate.AddDate(0, 0, i)
	case FinancialRecordSerieInterval.WEEKLY:
		return this.StartDate.AddDate(0, 0, 7*i)
	case FinancialRecordSerieInterval.MONTHLY:
		return addMonthsClamped(this.StartDate, i)
	case FinancialRecordSerieInterval.YEARLY:
		return addMonthsClamped(this.StartDate, 12*i)
	case FinancialRecordSerieInterval.CUSTOM:
		days := 1
		if this.IntervalDays != nil {
			days = *this.IntervalDays
		}
		return this.StartDate.AddDate(0, 0, days*i)
	}
	return this.StartDate
}

func addMonthsClamped(t time.Time, months int) time.Time {
	firstOfMonth := time.Date(t.Year(), t.Month()+time.Month(months), 1, t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), t.Location())
	lastDay := firstOfMonth.AddDate(0, 1, -1).Day()
	day := min(t.Day(), lastDay)
	return firstOfMonth.AddDate(0, 0, day-1)
}

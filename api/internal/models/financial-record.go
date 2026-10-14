package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type TFinancialRecordType = struct {
	INCOME  int
	EXPENSE int
}

var FinancialRecordType = &TFinancialRecordType{
	INCOME:  1,
	EXPENSE: 2,
}

type FinancialRecord struct {
	ID          uint64          `gorm:"primaryKey" json:"id"`
	Name        string          `gorm:"size:255;not null" json:"name"`
	Amount      decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"amount"`
	Type        int             `gorm:"type:smallint;not null" json:"type"`
	DueDate     time.Time       `gorm:"index;not null" json:"due_date"`
	ConfirmedAt *time.Time      `json:"confirmed_at"`
	Installment int             `json:"installment"`
	// Origin of imported records (bank or credit card statements), used to skip duplicated imports.
	Vendor       *string `gorm:"size:32;index:idx_financial_record_vendor" json:"vendor"`
	VendorSource *string `gorm:"size:32;index:idx_financial_record_vendor" json:"vendor_source"`
	VendorId     *string `gorm:"size:128;index:idx_financial_record_vendor" json:"vendor_id"`
	// Entry description as written by the vendor, kept while the user may rename the record.
	VendorName *string `gorm:"size:255" json:"vendor_name"`
	BelongsToUser
	FinancialRecordSerieId uint64                `gorm:"index" json:"financial_record_serie_id"`
	Serie                  *FinancialRecordSerie `gorm:"foreignKey:FinancialRecordSerieId" json:"serie,omitempty"`
	Tags                   []Tag                 `gorm:"many2many:financial_record_tags" json:"tags"`
	CreatedAt              time.Time             `gorm:"not null" json:"created_at"`
	UpdatedAt              time.Time             `gorm:"not null" json:"-"`
	DeletedAt              gorm.DeletedAt        `json:"-"`
}

func OfTheMonth(month *time.Time) func(stmt *gorm.Statement) {
	return func(stmt *gorm.Statement) {
		monthStart := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, month.Location())
		monthEnd := monthStart.AddDate(0, 1, 0)
		stmt.Where("due_date >= ? AND due_date < ?", monthStart, monthEnd)
	}
}

func ExpensesOfTheMonth(month *time.Time) func(stmt *gorm.Statement) {
	return func(stmt *gorm.Statement) {
		OfTheMonth(month)(stmt)
		stmt.Where("type = ?", FinancialRecordType.EXPENSE)
	}
}

func IncomesOfTheMonth(month *time.Time) func(stmt *gorm.Statement) {
	return func(stmt *gorm.Statement) {
		OfTheMonth(month)(stmt)
		stmt.Where("type = ?", FinancialRecordType.INCOME)
	}
}

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
	DueDate     time.Time       `gorm:"not null" json:"due_date"`
	ConfirmedAt *time.Time      `json:"confirmed_at"`
	Installment int             `json:"installment"`
	BelongsToUser
	FinancialRecordSerieId uint64               `gorm:"index" json:"financial_record_serie_id"`
	Serie                  FinancialRecordSerie `gorm:"foreignKey:FinancialRecordSerieId" json:"-"`
	CreatedAt              time.Time            `gorm:"not null" json:"created_at"`
	UpdatedAt              time.Time            `gorm:"not null" json:"-"`
	DeletedAt              gorm.DeletedAt       `json:"-"`
}

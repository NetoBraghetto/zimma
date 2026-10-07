package models

import (
	"time"

	"gorm.io/gorm"
)

type Tag struct {
	ID    uint64 `gorm:"primaryKey" json:"id"`
	Name  string `gorm:"size:50;not null" json:"name"`
	Color string `gorm:"size:7;not null" json:"color"`
	Icon  string `gorm:"size:30;not null;default:''" json:"icon"`
	BelongsToUser
	CreatedAt time.Time      `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time      `gorm:"not null" json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-"`
}

package models

import (
	"gorm.io/gorm"
)

type BelongsToUser struct {
	UserId uint64 `gorm:"index" json:"user_id"`
	User   User   `gorm:"foreignKey:UserId" json:"-"`
}

func (this *BelongsToUser) BeforeSave(tx *gorm.DB) error {
	if user, ok := tx.Statement.Context.Value("authenticatedUser").(User); ok {
		this.UserId = user.ID
	}
	return nil
}

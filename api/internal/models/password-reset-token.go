package models

import "time"

// PasswordResetToken stores a SHA-256 hash of a password recovery token.
// The plain token is only ever sent to the user's e-mail.
type PasswordResetToken struct {
	ID        uint64    `gorm:"primaryKey" json:"-"`
	Email     string    `gorm:"size:255;not null;index" json:"-"`
	TokenHash string    `gorm:"size:64;not null;uniqueIndex" json:"-"`
	ExpiresAt time.Time `gorm:"not null" json:"-"`
	CreatedAt time.Time `gorm:"not null" json:"-"`
}

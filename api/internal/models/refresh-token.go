package models

import "time"

// RefreshToken lets a client get a new access token (JWT) without logging in again. Only the
// SHA-256 hash is stored; each token is single use and replaced by a new one when used.
type RefreshToken struct {
	ID        uint64    `gorm:"primaryKey"`
	UserID    uint64    `gorm:"not null;index"`
	TokenHash string    `gorm:"size:64;not null;uniqueIndex"`
	ExpiresAt time.Time `gorm:"not null;index"`
	CreatedAt time.Time `gorm:"not null"`
}

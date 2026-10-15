package models

import "time"

const (
	OAuthModeLogin = "login"
	OAuthModeLink  = "link"
)

// OAuthState tracks one social login attempt, from the redirect to the
// provider until the webapp exchanges the one-time result code for a JWT.
// Secrets are stored as SHA-256 hashes.
type OAuthState struct {
	ID             uint64  `gorm:"primaryKey"`
	Provider       string  `gorm:"size:32;not null"`
	Mode           string  `gorm:"size:16;not null"`
	StateHash      string  `gorm:"size:64;not null;uniqueIndex"`
	NonceHash      string  `gorm:"size:64;not null"`
	CodeVerifier   string  `gorm:"size:128;not null"`
	UserID         *uint64 // user linking an account (link mode only)
	ResultCodeHash *string `gorm:"size:64;uniqueIndex"`
	ResultUserID   *uint64
	ExpiresAt      time.Time `gorm:"not null;index"`
	CreatedAt      time.Time `gorm:"not null"`
}

func (OAuthState) TableName() string {
	return "oauth_state"
}

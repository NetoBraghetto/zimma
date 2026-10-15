package models

import "time"

// SocialAccount links a user to an identity at an external OAuth provider.
type SocialAccount struct {
	ID             uint64    `gorm:"primaryKey" json:"-"`
	UserID         uint64    `gorm:"not null;uniqueIndex:idx_social_account_user_provider" json:"-"`
	Provider       string    `gorm:"size:32;not null;uniqueIndex:idx_social_account_user_provider;uniqueIndex:idx_social_account_provider_uid" json:"provider"`
	ProviderUserID string    `gorm:"size:255;not null;uniqueIndex:idx_social_account_provider_uid" json:"-"`
	Username       string    `gorm:"size:255" json:"username"`
	CreatedAt      time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt      time.Time `gorm:"not null" json:"-"`
}

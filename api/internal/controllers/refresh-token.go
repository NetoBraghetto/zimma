package controllers

import (
	"log"
	"net/http"
	"time"

	"zimma/internal/bootstrap"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const refreshTokenTTL = 1 * 24 * time.Hour

// issueRefreshToken stores a new refresh token for the user and returns it in plain text.
// Expired tokens of the user are removed on the way.
func issueRefreshToken(db *gorm.DB, userID uint64) (string, time.Time, error) {
	token, err := services.GenerateSecureString(64)
	if err != nil {
		return "", time.Time{}, err
	}
	expiresAt := time.Now().Add(refreshTokenTTL)

	if err := db.Where("user_id = ? AND expires_at < ?", userID, time.Now()).Delete(&models.RefreshToken{}).Error; err != nil {
		return "", time.Time{}, err
	}
	err = db.Create(&models.RefreshToken{UserID: userID, TokenHash: sha256Hex(token), ExpiresAt: expiresAt}).Error
	return token, expiresAt, err
}

type refreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required,max=255"`
}

// Refresh trades a valid refresh token for a new access token and a new refresh token.
func (this *AuthController) Refresh(c *gin.Context) {
	var req refreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	db := bootstrap.DB.WithContext(c.Request.Context())
	invalid := func() {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token"})
	}

	var stored models.RefreshToken
	if err := db.Where("token_hash = ? AND expires_at > ?", sha256Hex(req.RefreshToken), time.Now()).Take(&stored).Error; err != nil {
		invalid()
		return
	}
	// Single use: when two requests race with the same token, only the one that deletes it wins.
	if result := db.Where("id = ?", stored.ID).Delete(&models.RefreshToken{}); result.Error != nil || result.RowsAffected == 0 {
		invalid()
		return
	}

	var user models.User
	if err := db.Where("id = ?", stored.UserID).Take(&user).Error; err != nil {
		invalid()
		return
	}

	payload, err := issueAuthToken(c, user)
	if err != nil {
		log.Printf("refresh token: failed to issue tokens: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": payload})
}

// Logout revokes the given refresh token. The access token stays valid until it expires.
func (this *AuthController) Logout(c *gin.Context) {
	var req refreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	err := bootstrap.DB.WithContext(c.Request.Context()).
		Where("token_hash = ?", sha256Hex(req.RefreshToken)).
		Delete(&models.RefreshToken{}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.Status(http.StatusNoContent)
}

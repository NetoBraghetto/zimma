package controllers

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"zimma/internal/bootstrap"
	"zimma/internal/config"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const passwordResetTokenTTL = time.Hour

type passwordRecoveryRequest struct {
	Email string `json:"email" binding:"required,email,max=255"`
}

// PasswordRecovery issues a reset token and e-mails a link to the user.
// It always answers 200 so callers cannot discover which e-mails are registered.
func (this *AuthController) PasswordRecovery(c *gin.Context) {
	var req passwordRecoveryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error":  err.Error(),
			"errors": gin.H{"email": []string{"Informe um e-mail válido."}},
		})
		return
	}
	email := strings.TrimSpace(req.Email)
	ctx := c.Request.Context()

	user, err := this.getBuilder().Where("email = ?", email).Take(ctx)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("password recovery: failed to find user: %v", err)
		}
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}

	token, err := services.GenerateSecureString(64)
	if err != nil {
		log.Printf("password recovery: failed to generate token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	err = bootstrap.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("email = ?", user.Email).Delete(&models.PasswordResetToken{}).Error; err != nil {
			return err
		}
		return tx.Create(&models.PasswordResetToken{
			Email:     user.Email,
			TokenHash: hashResetToken(token),
			ExpiresAt: time.Now().Add(passwordResetTokenTTL),
		}).Error
	})
	if err != nil {
		log.Printf("password recovery: failed to store token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	link := fmt.Sprintf("%s/autenticacao/reset-senha?token=%s", config.Get[string]("app.url"), url.QueryEscape(token))
	body := fmt.Sprintf(
		"Olá!\n\nRecebemos uma solicitação para redefinir a senha da sua conta.\n\n"+
			"Para criar uma nova senha, acesse o link abaixo:\n%s\n\n"+
			"O link expira em %d minutos. Se você não fez essa solicitação, ignore este e-mail.\n",
		link, int(passwordResetTokenTTL.Minutes()),
	)

	// Send in background so the response time does not reveal whether the e-mail exists.
	go func(to string) {
		if err := services.SendMail(to, "Redefinição de senha", body); err != nil {
			log.Printf("password recovery: %v", err)
		}
	}(user.Email)

	c.JSON(http.StatusOK, gin.H{"data": nil})
}

type passwordResetRequest struct {
	Email                string `json:"email"`
	Token                string `json:"token"`
	Password             string `json:"password"`
	PasswordConfirmation string `json:"password_confirmation"`
}

// PasswordReset validates the token sent by e-mail and sets a new password.
func (this *AuthController) PasswordReset(c *gin.Context) {
	var req passwordResetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	req.Email = strings.TrimSpace(req.Email)

	fieldErrors := gin.H{}
	if req.Email == "" || len(req.Email) > 255 {
		fieldErrors["email"] = []string{"Informe um e-mail válido."}
	}
	if req.Token == "" {
		fieldErrors["token"] = []string{"Token de redefinição ausente."}
	}
	if len(req.Password) < 3 || len(req.Password) > 255 {
		fieldErrors["password"] = []string{"A senha deve ter entre 3 e 255 caracteres."}
	}
	if req.Password != req.PasswordConfirmation {
		fieldErrors["password_confirmation"] = []string{"A confirmação de senha não confere."}
	}
	if len(fieldErrors) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "validation failed", "errors": fieldErrors})
		return
	}

	invalidToken := func() {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error":  "invalid or expired token",
			"errors": gin.H{"email": []string{"Link de redefinição inválido ou expirado."}},
		})
	}

	ctx := c.Request.Context()
	var resetToken models.PasswordResetToken
	err := bootstrap.DB.WithContext(ctx).
		Where("email = ? AND token_hash = ? AND expires_at > ?", req.Email, hashResetToken(req.Token), time.Now()).
		Take(&resetToken).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("password reset: failed to find token: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		invalidToken()
		return
	}

	hash, err := services.GenerateArgon2IdHash(req.Password)
	if err != nil {
		log.Printf("password reset: failed to hash password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	userFound := true
	err = bootstrap.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&models.User{}).Where("email = ?", req.Email).Update("password", hash)
		if result.Error != nil {
			return result.Error
		}
		userFound = result.RowsAffected > 0
		return tx.Where("email = ?", req.Email).Delete(&models.PasswordResetToken{}).Error
	})
	if err != nil {
		log.Printf("password reset: failed to update password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if !userFound {
		invalidToken()
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": nil})
}

func hashResetToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

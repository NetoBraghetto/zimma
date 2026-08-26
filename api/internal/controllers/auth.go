package controllers

import (
	"context"
	"crypto/rsa"
	"log"
	"net/http"
	"strconv"
	"time"

	"zimma/internal/bootstrap"
	"zimma/internal/config"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type AuthController struct {
	RestfulController[models.User]
}

func NewAuthController() *AuthController {
	return &AuthController{
		RestfulController: RestfulController[models.User]{
			builder: gorm.G[models.User](bootstrap.DB),
		},
	}
}

type registerUser struct {
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=3,max=255"`
}

func (this *AuthController) Register(c *gin.Context) {
	var req registerUser
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	var exists int
	err := bootstrap.DB.Raw("SELECT 1 FROM \"user\" WHERE EXISTS (SELECT 1 FROM \"user\" WHERE email = ?)", req.Email).Scan(&exists).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if exists == 1 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "email already exists"})
		return
	}

	hash, err := services.GenerateArgon2IdHash(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()
	created := &models.User{Email: req.Email, Password: hash}
	err = gorm.G[models.User](bootstrap.DB).Create(ctx, created)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

type loginUser struct {
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=3,max=255"`
}

func (this *AuthController) Login(c *gin.Context) {
	var req loginUser
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "req": req})
		return
	}
	ctx := context.Background()

	user, err := this.getBuilder().Where("email", req.Email).Take(ctx)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{})
		return
	}

	if ok, err := services.VerifyArgon2IdHash(req.Password, user.Password); !ok || err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{})
		return
	}

	now := time.Now()
	jti, _ := services.GenerateSecureString(16)
	expiresIn := now.Add(time.Hour * 1).Unix()
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.RegisteredClaims{
		Issuer:    c.Request.URL.String(),
		Subject:   strconv.FormatUint(user.ID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		NotBefore: jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(time.Unix(expiresIn, 0)),
		ID:        jti,
	})
	tokenString, err := token.SignedString(config.Get[*rsa.PrivateKey]("app.signing_key"))
	if err != nil {
		log.Default().Printf("failed to sign token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"user":       user,
		"token":      tokenString,
		"expires_in": expiresIn,
		"token_type": "Bearer",
	}})
}

func (this *AuthController) Me(c *gin.Context) {
	user, exists := c.Get("authenticatedUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

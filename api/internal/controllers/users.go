package controllers

import (
	"context"

	"zimma/internal/bootstrap"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserController struct{}

func (this *UserController) List(c *gin.Context) {
	ctx := context.Background()

	collection, err := gorm.G[models.User](bootstrap.DB).Limit(30).Find(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data": collection,
		"meta": gin.H{},
	})
}

type storeUser struct {
	Name     string `json:"name" binding:"required,min=3,max=255"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=8,max=255"`
}

func (this *UserController) Store(c *gin.Context) {
	var req storeUser
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(422, gin.H{"error": err.Error()})
		return
	}

	var exists int
	err := bootstrap.DB.Raw("SELECT 1 FROM user WHERE EXISTS (SELECT 1 FROM user WHERE 'email' = ?)", req.Email).Scan(&exists).Error
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if exists == 1 {
		c.JSON(422, gin.H{"error": "email already exists"})
		return
	}

	hash, err := services.GenerateArgon2IdHash(req.Password)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()
	created := &models.User{Name: req.Name, Email: req.Email, Password: hash}
	err = gorm.G[models.User](bootstrap.DB).Create(ctx, created)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"data": created})
}

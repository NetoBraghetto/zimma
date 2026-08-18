package controllers

import (
	"context"
	"net/http"

	"zimma/internal/bootstrap"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserController struct {
	RestfulController[models.User]
}

func NewUserController() *UserController {
	return &UserController{
		RestfulController: RestfulController[models.User]{
			builder: gorm.G[models.User](bootstrap.DB),
		},
	}
}

type storeUser struct {
	Name     string `json:"name" binding:"required,min=3,max=255"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=8,max=255"`
}

func (this *UserController) Store(c *gin.Context) {
	var req storeUser
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	var exists int
	err := bootstrap.DB.Raw("SELECT 1 FROM user WHERE EXISTS (SELECT 1 FROM user WHERE email = ?)", req.Email).Scan(&exists).Error
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
	created := &models.User{Name: req.Name, Email: req.Email, Password: hash}
	err = gorm.G[models.User](bootstrap.DB).Create(ctx, created)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

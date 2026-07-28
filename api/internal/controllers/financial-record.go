package controllers

import (
	"context"

	"zimma/internal/bootstrap"
	"zimma/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FinancialRecordController struct{}

func (this *FinancialRecordController) List(c *gin.Context) {
	ctx := context.Background()

	collection, err := gorm.G[models.FinancialRecord](bootstrap.DB).Limit(30).Find(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data": collection,
		"meta": gin.H{},
	})
}

// type storeFinancialRecord struct {
// 	Name        string `json:"name" binding:"required,min=3,max=255"`
// 	Amount      string `json:"amount" binding:"required"`
// 	Type        int    `json:"type" binding:"required"`
// 	DueDate     string `json:"due_date" binding:"required"`
// 	ConfirmedAt string `json:"confirmed_at"`
// }

// func (this *FinancialRecordController) Store(c *gin.Context) {
// 	var req storeFinancialRecord
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		c.JSON(422, gin.H{"error": err.Error()})
// 		return
// 	}

// 	var exists int
// 	err := bootstrap.DB.Raw("SELECT 1 FROM user WHERE EXISTS (SELECT 1 FROM user WHERE email = ?)", req.Email).Scan(&exists).Error
// 	if err != nil {
// 		c.JSON(500, gin.H{"error": err.Error()})
// 		return
// 	}

// 	if exists == 1 {
// 		c.JSON(422, gin.H{"error": "email already exists"})
// 		return
// 	}

// 	hash, err := services.GenerateArgon2IdHash(req.Password)
// 	if err != nil {
// 		c.JSON(500, gin.H{"error": err.Error()})
// 		return
// 	}

// 	ctx := context.Background()
// 	created := &models.User{Name: req.Name, Email: req.Email, Password: hash}
// 	err = gorm.G[models.User](bootstrap.DB).Create(ctx, created)
// 	if err != nil {
// 		c.JSON(500, gin.H{"error": err.Error()})
// 		return
// 	}

// 	c.JSON(201, gin.H{"data": created})
// }

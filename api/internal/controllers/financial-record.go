package controllers

import (
	"context"
	"net/http"
	"time"

	"zimma/internal/bootstrap"
	"zimma/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type FinancialRecordController struct {
	RestfulController[models.FinancialRecord]
}

func NewFinancialRecordController() *FinancialRecordController {
	return &FinancialRecordController{
		RestfulController: RestfulController[models.FinancialRecord]{
			builder: gorm.G[models.FinancialRecord](bootstrap.DB),
		},
	}
}

type storeFinancialRecord struct {
	Name      string          `json:"name" binding:"required,min=3,max=255"`
	Amount    decimal.Decimal `json:"amount" binding:"required"`
	Type      int             `json:"type" binding:"required,oneof=1 2"`
	DueDate   string          `json:"due_date" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
	Confirmed *bool           `json:"confirmed" binding:"required,boolean"`
}

func (this *FinancialRecordController) Store(c *gin.Context) {
	var req storeFinancialRecord
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "req": req})
		return
	}

	if req.Amount.LessThan(decimal.Zero) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "amount must be greater than or equal to 0"})
		return
	}

	ctx := context.Background()
	created := &models.FinancialRecord{
		Name:   req.Name,
		Amount: req.Amount,
		Type:   models.FinancialRecordType(req.Type),
		DueDate: func() time.Time {
			t, _ := time.Parse("2006-01-02T15:04:05Z07:00", req.DueDate)
			return t
		}(),
		ConfirmedAt: func() *time.Time {
			if req.Confirmed == nil || !*req.Confirmed {
				return nil
			}
			t := time.Now()
			return &t
		}(),
	}

	err := this.getBuilder().Create(ctx, created)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

type updateFinancialRecord struct {
	Name      string          `json:"name" binding:"required,min=3,max=255"`
	Amount    decimal.Decimal `json:"amount" binding:"required"`
	DueDate   string          `json:"due_date" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
	Confirmed *bool           `json:"confirmed" binding:"required,boolean"`
}

func (this *FinancialRecordController) Update(c *gin.Context) {
	var req updateFinancialRecord
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "req": req})
		return
	}
	id, _ := c.Params.Get("id")

	if req.Amount.LessThan(decimal.Zero) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "amount must be greater than or equal to 0"})
		return
	}

	ctx := context.Background()
	resource, err := this.getBuilder().Where("id", id).Take(ctx)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "record not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	resource.Name = req.Name
	resource.Amount = req.Amount
	resource.DueDate, _ = time.Parse("2006-01-02T15:04:05Z07:00", req.DueDate)
	if req.Confirmed == nil || !*req.Confirmed {
		resource.ConfirmedAt = nil
	} else {
		t := time.Now()
		resource.ConfirmedAt = &t
	}
	err = bootstrap.DB.Save(resource).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resource})
}

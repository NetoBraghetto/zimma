package controllers

import (
	"context"
	"strconv"
	"time"

	"zimma/internal/bootstrap"
	"zimma/internal/enums"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type FinancialRecordController struct{}

func (this *FinancialRecordController) getBuilder() gorm.Interface[models.FinancialRecord] {
	return gorm.G[models.FinancialRecord](bootstrap.DB)
}

func (this *FinancialRecordController) List(c *gin.Context) {
	ctx := context.Background()
	qs := services.QueryString[models.FinancialRecord]{}

	page, _ := strconv.Atoi(
		c.DefaultQuery(string(enums.QueryStringParamKeyPage), "1"),
	)
	pageSize, _ := strconv.Atoi(
		c.DefaultQuery(string(enums.QueryStringParamKeyPageSize), "30"),
	)

	// builder := qs.Paginate(this.getBuilder(), services.QueryStringPaginationParams{Page: page, PageSize: pageSize})

	collection, pagination, err := qs.Paginate(
		this.getBuilder(),
		&services.QueryStringPaginationParams{Page: page, PageSize: pageSize},
		ctx,
	)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data": collection,
		"meta": gin.H{
			"pagination": pagination,
		},
	})
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
		c.JSON(422, gin.H{"error": err.Error(), "req": req})
		return
	}

	if req.Amount.LessThan(decimal.Zero) {
		c.JSON(422, gin.H{"error": "amount must be greater than or equal to 0"})
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

	err := gorm.G[models.FinancialRecord](bootstrap.DB).Create(ctx, created)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"data": created})
}

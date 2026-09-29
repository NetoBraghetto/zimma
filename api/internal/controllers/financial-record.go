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
	Name         string          `json:"name" binding:"required,min=3,max=255"`
	Amount       decimal.Decimal `json:"amount" binding:"required"`
	Type         int             `json:"type" binding:"required,oneof=1 2"`
	DueDate      string          `json:"due_date" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
	Confirmed    *bool           `json:"confirmed" binding:"required,boolean"`
	RecurrenceId int             `json:"recurrence_id" binding:"required,oneof=1 2 3 4"`
	IntervalId   *int            `json:"interval_id"`
	IntervalDays *int            `json:"interval_days"`
	RepeatCount  *int            `json:"repeat_count"`
}

func (this *storeFinancialRecord) hasRepeatCount() bool {
	return this.RecurrenceId == models.FinancialRecordSerieRecurrence.REPEAT || this.RecurrenceId == models.FinancialRecordSerieRecurrence.SPLITED
}

func (this *storeFinancialRecord) validateRecurrence() string {
	if this.RecurrenceId == models.FinancialRecordSerieRecurrence.UNIQUE {
		return ""
	}

	if this.IntervalId == nil || *this.IntervalId < int(models.FinancialRecordSerieInterval.DAILY) || *this.IntervalId > int(models.FinancialRecordSerieInterval.CUSTOM) {
		return "interval must be one of 1 2 3 4 5"
	}
	if *this.IntervalId == models.FinancialRecordSerieInterval.CUSTOM && (this.IntervalDays == nil || *this.IntervalDays < 1) {
		return "interval_days must be greater than or equal to 1"
	}
	if this.hasRepeatCount() && (this.RepeatCount == nil || *this.RepeatCount < 2 || *this.RepeatCount > 360) {
		return "repeat_count must be between 2 and 360"
	}
	return ""
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

	if msg := req.validateRecurrence(); msg != "" {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": msg})
		return
	}

	// ctx := context.Background()
	dueDate, _ := time.Parse("2006-01-02T15:04:05Z07:00", req.DueDate)
	created := &models.FinancialRecord{
		Name:    req.Name,
		Amount:  req.Amount,
		Type:    req.Type,
		DueDate: dueDate,
		ConfirmedAt: func() *time.Time {
			if req.Confirmed == nil || !*req.Confirmed {
				return nil
			}
			t := time.Now()
			return &t
		}(),
	}

	var err error
	err = bootstrap.DB.WithContext(c).Transaction(func(tx *gorm.DB) error {
		serie := &models.FinancialRecordSerie{
			Name:         req.Name,
			Amount:       req.Amount,
			Type:         req.Type,
			RecurrenceId: req.RecurrenceId,
			IntervalId:   req.IntervalId,
			IntervalDays: req.IntervalDays,
			RepeatCount:  req.RepeatCount,
			StartDate:    dueDate,
		}
		if serie.IntervalId == nil || *serie.IntervalId != models.FinancialRecordSerieInterval.CUSTOM {
			serie.IntervalDays = nil
		}
		if !req.hasRepeatCount() {
			serie.RepeatCount = nil
		}
		if err := tx.Create(serie).Error; err != nil {
			return err
		}

		total := 1
		if serie.RepeatCount != nil {
			total = *serie.RepeatCount
		}
		occurrences := make([]models.FinancialRecord, total)
		for i := range occurrences {
			installment := i + 1
			occurrences[i] = models.FinancialRecord{
				Name:                   serie.Name,
				Amount:                 serie.OccurrenceAmount(i),
				Type:                   serie.Type,
				DueDate:                serie.OccurrenceDate(i),
				FinancialRecordSerieId: serie.ID,
				Installment:            installment,
			}
		}
		occurrences[0].ConfirmedAt = created.ConfirmedAt
		if err := tx.Create(&occurrences).Error; err != nil {
			return err
		}
		*created = occurrences[0]
		return nil
	})
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

package controllers

import (
	"net/http"
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

type listFinancialRecord struct {
	Month string `form:"month" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
	Type  int    `form:"type" binding:"omitempty,oneof=1 2"`
}

func (this *FinancialRecordController) List(c *gin.Context) {
	var req listFinancialRecord
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "req": req})
		return
	}

	month, _ := time.Parse("2006-01-02T15:04:05Z07:00", req.Month)
	nextMonth := time.Date(month.Year(), month.Month()+1, 1, 0, 0, 0, 0, month.Location())
	if err := services.MaterializeRecurringSeries(c, bootstrap.DB, nextMonth); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	qs := services.QueryString[models.FinancialRecord]{}

	builder := this.getBuilder().Scopes(models.OfTheMonth(&month))
	if req.Type != 0 {
		builder = builder.Where("type = ?", req.Type)
	}

	page, _ := strconv.Atoi(
		c.DefaultQuery(string(enums.QueryStringParamKeyPage), "1"),
	)
	pageSize, _ := strconv.Atoi(
		c.DefaultQuery(string(enums.QueryStringParamKeyPageSize), "100"),
	)

	collection, pagination, err := qs.Paginate(
		builder.Order("due_date, id").Preload("Serie", nil).Preload("Tags", nil),
		&services.QueryStringPaginationParams{Page: page, PageSize: pageSize},
		c,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": collection,
		"meta": gin.H{
			"pagination": pagination,
		},
	})
}

// findTags loads the given tags; the belongs_to_user scope restricts them to the authenticated user.
func findTags(c *gin.Context, tx *gorm.DB, ids []uint64) ([]models.Tag, error) {
	if len(ids) == 0 {
		return []models.Tag{}, nil
	}
	return gorm.G[models.Tag](tx).Where("id IN ?", ids).Find(c)
}

func (this *FinancialRecordController) View(c *gin.Context) {
	resource, err := this.getBuilder().Where("id", c.Param("id")).Preload("Serie", nil).Preload("Tags", nil).Take(c)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": resource,
		"meta": gin.H{},
	})
}

type storeFinancialRecord struct {
	Name         string          `json:"name" binding:"required,min=3,max=255"`
	Amount       decimal.Decimal `json:"amount" binding:"required"`
	Type         int             `json:"type" binding:"required,oneof=1 2"`
	DueDate      string          `json:"due_date" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
	PurchaseDate string          `json:"purchase_date" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	Confirmed    *bool           `json:"confirmed" binding:"required,boolean"`
	RecurrenceId int             `json:"recurrence_id" binding:"required,oneof=1 2 3 4"`
	IntervalId   *int            `json:"interval_id"`
	IntervalDays *int            `json:"interval_days"`
	RepeatCount  *int            `json:"repeat_count"`
	Tags         []uint64        `json:"tags" binding:"max=20"`
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

	dueDate, _ := time.Parse("2006-01-02T15:04:05Z07:00", req.DueDate)
	purchaseDate := parseOptionalDate(req.PurchaseDate)
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

		tags, err := findTags(c, tx, req.Tags)
		if err != nil {
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
				Name:    serie.Name,
				Amount:  serie.OccurrenceAmount(i),
				Type:    serie.Type,
				DueDate: serie.OccurrenceDate(i),
				// Every installment comes from the same purchase.
				PurchaseDate:           purchaseDate,
				FinancialRecordSerieId: serie.ID,
				Installment:            installment,
				Tags:                   tags,
			}
		}
		occurrences[0].ConfirmedAt = created.ConfirmedAt
		// "Tags.*" only links the existing tags instead of upserting them.
		if err := tx.Omit("Tags.*").Create(&occurrences).Error; err != nil {
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
	Name         string          `json:"name" binding:"required,min=3,max=255"`
	Amount       decimal.Decimal `json:"amount" binding:"required"`
	DueDate      string          `json:"due_date" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
	PurchaseDate string          `json:"purchase_date" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	Confirmed    *bool           `json:"confirmed" binding:"required,boolean"`
	Tags         []uint64        `json:"tags" binding:"max=20"`
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

	resource, err := this.getBuilder().Where("id", id).Take(c)
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
	resource.PurchaseDate = parseOptionalDate(req.PurchaseDate)
	if req.Confirmed == nil || !*req.Confirmed {
		resource.ConfirmedAt = nil
	} else {
		t := time.Now()
		resource.ConfirmedAt = &t
	}
	err = bootstrap.DB.WithContext(c).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&resource).Error; err != nil {
			return err
		}
		tags, err := findTags(c, tx, req.Tags)
		if err != nil {
			return err
		}
		resource.Tags = tags
		return tx.Model(&resource).Omit("Tags.*").Association("Tags").Replace(tags)
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resource})
}

// parseOptionalDate parses an already validated RFC3339 date, returning nil when it is empty.
func parseOptionalDate(value string) *time.Time {
	if value == "" {
		return nil
	}
	date, _ := time.Parse(time.RFC3339, value)
	return &date
}

func (this *FinancialRecordController) FormDependencies(c *gin.Context) {
	tags, err := gorm.G[models.Tag](bootstrap.DB).
		Order("name, id").
		Find(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"tags": tags,
		},
		"meta": gin.H{},
	})
}

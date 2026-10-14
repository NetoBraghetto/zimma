package controllers

import (
	"net/http"
	"time"

	"zimma/internal/bootstrap"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type HomeController struct{}

func NewHomeController() *HomeController {
	return &HomeController{}
}

type dashboardRequest struct {
	Month string `form:"month" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
}

func (this *HomeController) Dashboard(c *gin.Context) {
	var req dashboardRequest
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
	expenses, err := gorm.G[models.FinancialRecord](bootstrap.DB).
		Scopes(models.ExpensesOfTheMonth(&month)).
		Preload("Tags", nil).
		Find(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	incomes, err := gorm.G[models.FinancialRecord](bootstrap.DB).
		Scopes(models.IncomesOfTheMonth(&month)).
		Preload("Tags", nil).
		Find(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	previousMonth := time.Date(month.Year(), month.Month()-1, 1, 0, 0, 0, 0, month.Location())
	var previousExpenses, previousIncomes struct{ Total decimal.Decimal }
	if err := gorm.G[models.FinancialRecord](bootstrap.DB).
		Scopes(models.ExpensesOfTheMonth(&previousMonth)).
		Select("COALESCE(SUM(amount), 0) AS total").
		Scan(c, &previousExpenses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := gorm.G[models.FinancialRecord](bootstrap.DB).
		Scopes(models.IncomesOfTheMonth(&previousMonth)).
		Select("COALESCE(SUM(amount), 0) AS total").
		Scan(c, &previousIncomes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data": gin.H{
			"incomes":                      incomes,
			"expenses":                     expenses,
			"previous_month_total_income":  previousIncomes.Total,
			"previous_month_total_expense": previousExpenses.Total,
		},
	})
}

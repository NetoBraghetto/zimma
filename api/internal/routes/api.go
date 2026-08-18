package routes

import (
	"net/http"

	"zimma/internal/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterApiRoutes(router *gin.Engine) {
	financialRecordController := controllers.NewFinancialRecordController()

	router.GET("/", (&controllers.HomeController{}).List)
	router.GET("/financial-records", financialRecordController.List)
	router.POST("/financial-records", financialRecordController.Store)
	router.GET("/financial-records/:id", financialRecordController.View)
	router.PUT("/financial-records/:id", financialRecordController.Update)
	router.DELETE("/financial-records/:id", financialRecordController.Delete)

	router.GET("/up", func(c *gin.Context) {
		c.AbortWithStatus(http.StatusNoContent)
	})
}

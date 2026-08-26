package routes

import (
	"net/http"

	"zimma/internal/controllers"
	"zimma/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterApiRoutes(router *gin.Engine) {
	financialRecordController := controllers.NewFinancialRecordController()
	authController := controllers.NewAuthController()

	authenticatedGroup := router.Group("/")
	authenticatedGroup.Use(middlewares.AuthMiddleware())
	authenticatedGroup.GET("/financial-records", financialRecordController.List)
	authenticatedGroup.POST("/financial-records", financialRecordController.Store)
	authenticatedGroup.GET("/financial-records/:id", financialRecordController.View)
	authenticatedGroup.PUT("/financial-records/:id", financialRecordController.Update)
	authenticatedGroup.DELETE("/financial-records/:id", financialRecordController.Delete)
	authenticatedGroup.GET("/me", authController.Me)

	// router.GET("/", (&controllers.HomeController{}).List)
	router.POST("/auth/register", authController.Register)
	router.POST("/auth/login", authController.Login)

	router.GET("/up", func(c *gin.Context) {
		c.AbortWithStatus(http.StatusNoContent)
	})
}

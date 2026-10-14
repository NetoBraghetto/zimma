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
	tagController := controllers.NewTagController()
	homeController := controllers.NewHomeController()
	importController := controllers.NewImportController()

	authenticatedGroup := router.Group("/")
	authenticatedGroup.Use(middlewares.AuthMiddleware())
	authenticatedGroup.GET("/dashboard", homeController.Dashboard)
	authenticatedGroup.GET("/financial-record", financialRecordController.List)
	authenticatedGroup.POST("/financial-record", financialRecordController.Store)
	authenticatedGroup.GET("/financial-record/form-dependencies", financialRecordController.FormDependencies)
	authenticatedGroup.GET("/financial-record/:id", financialRecordController.View)
	authenticatedGroup.PUT("/financial-record/:id", financialRecordController.Update)
	authenticatedGroup.DELETE("/financial-record/:id", financialRecordController.Delete)
	authenticatedGroup.GET("/tag", tagController.List)
	authenticatedGroup.POST("/tag", tagController.Store)
	authenticatedGroup.GET("/tag/:id", tagController.View)
	authenticatedGroup.PUT("/tag/:id", tagController.Update)
	authenticatedGroup.DELETE("/tag/:id", tagController.Delete)
	authenticatedGroup.POST("/import/preview", importController.Preview)
	authenticatedGroup.POST("/import", importController.Store)
	authenticatedGroup.GET("/me", authController.Me)

	// router.GET("/", (&controllers.HomeController{}).List)
	router.POST("/auth/register", authController.Register)
	router.POST("/auth/login", authController.Login)
	router.POST("/auth/password-recovery", authController.PasswordRecovery)
	router.POST("/auth/password-reset", authController.PasswordReset)

	router.GET("/up", func(c *gin.Context) {
		c.AbortWithStatus(http.StatusNoContent)
	})
}

package routes

import (
	"zimma/internal/controllers"

	"github.com/gin-gonic/gin"
)

func Api(router *gin.Engine) {
	router.GET("/", (&controllers.HomeController{}).List)
	router.GET("/financial-records", (&controllers.FinancialRecordController{}).List)
	router.POST("/financial-records", (&controllers.FinancialRecordController{}).Store)

	router.GET("/users", (&controllers.UserController{}).List)
	router.POST("/users", (&controllers.UserController{}).Store)

	router.GET("/up", func(c *gin.Context) {
		c.AbortWithStatus(204)
	})
}

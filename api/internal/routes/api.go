package routes

import (
	"zimma/internal/controllers"

	"github.com/gin-gonic/gin"
)

func Api(router *gin.Engine) {
	router.GET("/", controllers.Home)

	router.GET("/up", func(c *gin.Context) {
		c.AbortWithStatus(204)
	})
}

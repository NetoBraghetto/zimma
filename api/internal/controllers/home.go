package controllers

import (
	"time"

	"github.com/gin-gonic/gin"
)

type HomeController struct{}

func (this *HomeController) List(c *gin.Context) {
	c.JSON(200, gin.H{
		"now": time.Now().Format(time.RFC3339),
	})
}

package controllers

import (
	"zimma/internal/bootstrap"

	"github.com/gin-gonic/gin"
)

func ListUsers(c *gin.Context) {
	// var name string
	// err := bootstrap.DB.QueryRowContext(c.Request.Context(), "SELECT name FROM user LIMIT 30").Scan(&name)
	rows, err := bootstrap.DB.Query("SELECT * FROM user LIMIT 30")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data": rows.Scan(),
	})
}

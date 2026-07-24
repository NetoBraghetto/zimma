package bootstrap

import (
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func InitCors(router *gin.Engine) {
	router.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ","),
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
}

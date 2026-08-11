package main

import (
	"zimma/internal/bootstrap"
	"zimma/internal/config"
	"zimma/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load() // Loads .env file
	config.Load()

	bootstrap.InitDatabase()
	bootstrap.AutoMigrate()
	router := gin.Default()

	bootstrap.InitCors(router)
	router.Use(bootstrap.InitRateLimit())

	routes.RegisterApiRoutes(router)
	router.Run()
}

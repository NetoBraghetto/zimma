package main

import (
	"zimma/internal/bootstrap"
	"zimma/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load() // Loads .env file

	bootstrap.InitDatabase()

	router := gin.Default()
	routes.Api(router)
	router.Run()
}

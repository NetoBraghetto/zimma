package bootstrap

import (
	"fmt"
	"log"

	"zimma/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"

	"zimma/internal/config"
)

var DB *gorm.DB

func AutoMigrate() {
	DB.AutoMigrate(&models.User{}, &models.FinancialRecord{})
}

func InitDatabase() {
	connector := getDriverConn(config.Get[string]("db.driver"))
	logLevel := logger.Info
	if config.Get[string]("app.env") == "production" {
		logLevel = logger.Silent
	}

	var dbErr error
	DB, dbErr = gorm.Open(connector, &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if dbErr != nil {
		log.Fatalf("Failed to connect to the database: %v", dbErr)
	}

	// // Maximum number of open connections to the database.
	// DB.SetMaxOpenConns(25)
	// // Maximum number of idle connections retained in the pool.
	// DB.SetMaxIdleConns(10)
	// // Maximum amount of time a connection may be reused.
	// DB.SetConnMaxLifetime(5 * time.Minute)
	// // Maximum amount of time a connection may sit idle before being closed.
	// DB.SetConnMaxIdleTime(1 * time.Minute)
}

func getDriverConn(driver string) gorm.Dialector {
	var conn gorm.Dialector
	switch driver {
	// case "mysql":
	//   dsn := fmt.Sprintf(
	// 	"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=UTC",
	// 	config.Get[string]("db.username"),
	// 	config.Get[string]("db.password"),
	// 	config.Get[string]("db.host"),
	// 	config.Get[string]("db.port"),
	// 	config.Get[string]("db.database"),
	//   )
	//   conn = mysql.Open(dsn)
	case "postgres":
		dsn := fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
			config.Get[string]("db.host"),
			config.Get[string]("db.username"),
			config.Get[string]("db.password"),
			config.Get[string]("db.database"),
			config.Get[string]("db.port"),
		)
		conn = postgres.Open(dsn)
	default:
		log.Fatalf("Unsupported database driver: %s", driver)
	}

	return conn
}

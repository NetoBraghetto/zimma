package bootstrap

import (
	"fmt"
	"log"

	"zimma/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"

	"zimma/internal/config"

	// The underscore registers the mysql driver with database/sql
	_ "github.com/go-sql-driver/mysql"
)

var DB *gorm.DB

func AutoMigrate() {
	DB.AutoMigrate(&models.User{}, &models.FinancialRecord{})
}

func InitDatabase() {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=UTC",
		config.Get[string]("db.username"),
		config.Get[string]("db.password"),
		config.Get[string]("db.host"),
		config.Get[string]("db.port"),
		config.Get[string]("db.database"),
	)

	var dbErr error
	DB, dbErr = gorm.Open(mysql.Open(dsn), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if dbErr != nil {
		log.Fatalf("Failed to connect to the database: %v", dbErr)
	}
}

// var DB *sql.DB

// func InitDatabase() {
// 	var err error
// 	url := strings.Join([]string{
// 		config.Get[string]("db.username") + ":" + config.Get[string]("db.password"),
// 		"@tcp(" + config.Get[string]("db.host") + ":" + config.Get[string]("db.port") + ")",
// 		"/" + config.Get[string]("db.database"),
// 	}, "")

// 	DB, err = sql.Open(config.Get[string]("db.driver"), url)
// 	if err != nil {
// 		log.Fatal(err)
// 	}
// 	// defer DB.Close()

// 	// // Maximum number of open connections to the database.
// 	// DB.SetMaxOpenConns(25)
// 	// // Maximum number of idle connections retained in the pool.
// 	// DB.SetMaxIdleConns(10)
// 	// // Maximum amount of time a connection may be reused.
// 	// DB.SetConnMaxLifetime(5 * time.Minute)
// 	// // Maximum amount of time a connection may sit idle before being closed.
// 	// DB.SetConnMaxIdleTime(1 * time.Minute)
// }

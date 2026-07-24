package bootstrap

import (
	"database/sql"
	"log"
	"os"
	"strings"

	// The underscore registers the mysql driver with database/sql
	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func InitDatabase() {
	var err error
	configs := []string{
		os.Getenv("DB_USERNAME") + ":" + os.Getenv("DB_PASSWORD"),
		"@tcp(" + os.Getenv("DB_HOST") + ":" + os.Getenv("DB_PORT") + ")",
		"/" + os.Getenv("DB_DATABASE"),
	}

	DB, err = sql.Open(os.Getenv("DB_DRIVER"), strings.Join(configs, ""))
	if err != nil {
		log.Fatal(err)
	}
	defer DB.Close()

	// // Maximum number of open connections to the database.
	// DB.SetMaxOpenConns(25)
	// // Maximum number of idle connections retained in the pool.
	// DB.SetMaxIdleConns(10)
	// // Maximum amount of time a connection may be reused.
	// DB.SetConnMaxLifetime(5 * time.Minute)
	// // Maximum amount of time a connection may sit idle before being closed.
	// DB.SetConnMaxIdleTime(1 * time.Minute)
}

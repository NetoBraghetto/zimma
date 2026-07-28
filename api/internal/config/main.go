package config

import (
	"os"
	"strings"
)

var configs = map[string]any{}

func Load() {
	configs = map[string]any{
		"app": map[string]any{
			"name":  os.Getenv("APP_NAME"),
			"env":   os.Getenv("APP_ENV"),
			"debug": os.Getenv("APP_DEBUG") == "true",
			// "key":   os.Getenv("APP_KEY"),
		},
		"db": map[string]any{
			"driver":   os.Getenv("DB_DRIVER"),
			"host":     os.Getenv("DB_HOST"),
			"port":     os.Getenv("DB_PORT"),
			"database": os.Getenv("DB_DATABASE"),
			"username": os.Getenv("DB_USERNAME"),
			"password": os.Getenv("DB_PASSWORD"),
		},
	}
}

func Get[T any](key string) T {
	var zero T
	keys := strings.Split(key, ".")
	var value any = configs
	for _, k := range keys {
		if m, ok := value.(map[string]any); ok {
			if v, exists := m[k]; exists {
				value = v
			} else {
				return zero
			}
		} else {
			return zero
		}
	}

	if typedValue, ok := value.(T); ok {
		return typedValue
	}
	return zero
}

func Set(key string, value any) {
	keys := strings.Split(key, ".")
	m := configs
	for i, k := range keys {
		if i == len(keys)-1 {
			m[k] = value
			return
		}
		if next, ok := m[k].(map[string]any); ok {
			m = next
		} else {
			newMap := make(map[string]any)
			m[k] = newMap
			m = newMap
		}
	}
}

package middlewares

import (
	"crypto/rsa"
	"net/http"

	"zimma/internal/bootstrap"
	"zimma/internal/config"
	"zimma/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authorization := c.GetHeader("Authorization")
		if authorization == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		token := authorization[len("Bearer "):]

		tokenParsed, err := jwt.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(token *jwt.Token) (any, error) {
			return config.Get[*rsa.PublicKey]("app.verifying_key"), nil
		})
		if err != nil || !tokenParsed.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		subject, err := tokenParsed.Claims.GetSubject()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		ctx := c.Request.Context()
		user, err := gorm.G[models.User](bootstrap.DB).Where("\"user\".\"id\" = ?", subject).First(ctx)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		c.Set("authenticatedUser", user)
		c.Next()
	}
}

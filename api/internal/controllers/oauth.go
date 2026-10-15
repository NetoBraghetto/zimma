package controllers

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"log"
	"net/http"
	"net/url"
	"time"

	"zimma/internal/bootstrap"
	"zimma/internal/config"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const (
	oauthStateTTL      = 10 * time.Minute
	oauthResultCodeTTL = 2 * time.Minute
)

// Error codes sent back to the webapp callback page.
const (
	oauthErrInvalidState = "invalid_state"
	oauthErrDenied       = "access_denied"
	oauthErrProvider     = "provider_error"
	oauthErrNotLinked    = "not_linked"
	oauthErrEmail        = "email_unverified"
	oauthErrInUse        = "account_in_use"
	oauthErrInternal     = "internal_error"
)

type OAuthController struct{}

func NewOAuthController() *OAuthController {
	return &OAuthController{}
}

// Authorize starts a social login. Returns the provider URL and a nonce the
// browser must present when exchanging the result, binding the flow to it.
func (this *OAuthController) Authorize(c *gin.Context) {
	this.start(c, models.OAuthModeLogin, nil)
}

// Link starts the flow to connect a provider to the authenticated user.
func (this *OAuthController) Link(c *gin.Context) {
	user, ok := c.MustGet("authenticatedUser").(models.User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	this.start(c, models.OAuthModeLink, &user.ID)
}

func (this *OAuthController) start(c *gin.Context, mode string, userID *uint64) {
	provider, ok := services.GetOAuthProvider(c.Param("provider"))
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "unknown provider"})
		return
	}
	if !provider.Configured() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "provider not configured"})
		return
	}

	state, err1 := services.GenerateSecureString(48)
	nonce, err2 := services.GenerateSecureString(48)
	verifier, err3 := services.GenerateSecureString(64)
	if err := errors.Join(err1, err2, err3); err != nil {
		log.Printf("oauth: failed to generate secrets: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	db := bootstrap.DB.WithContext(c.Request.Context())
	db.Where("expires_at < ?", time.Now()).Delete(&models.OAuthState{})

	err := db.Create(&models.OAuthState{
		Provider:     provider.Name(),
		Mode:         mode,
		StateHash:    sha256Hex(state),
		NonceHash:    sha256Hex(nonce),
		CodeVerifier: verifier,
		UserID:       userID,
		ExpiresAt:    time.Now().Add(oauthStateTTL),
	}).Error
	if err != nil {
		log.Printf("oauth: failed to store state: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	url := provider.AuthURL(state, services.PKCEChallenge(verifier))
	// if config.Get[string]("app.env") == "local" {
	// 	url = strings.Replace(url, "api."+os.Getenv("APP_DOMAIN"), os.Getenv("NGROK_DOMAIN"), 1)
	// 	url = strings.Replace(url, "redirect_uri=http", "redirect_uri=https", 1)
	// }

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"url":   url,
		"nonce": nonce,
	}})
}

// Callback receives the provider redirect, resolves the user and sends the
// browser back to the webapp with a short-lived, single-use result code.
func (this *OAuthController) Callback(c *gin.Context) {
	providerName := c.Param("provider")
	provider, ok := services.GetOAuthProvider(providerName)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "unknown provider"})
		return
	}

	ctx := c.Request.Context()
	db := bootstrap.DB.WithContext(ctx)

	var state models.OAuthState
	err := db.Where("state_hash = ? AND provider = ? AND result_code_hash IS NULL AND expires_at > ?",
		sha256Hex(c.Query("state")), provider.Name(), time.Now()).Take(&state).Error
	if err != nil {
		redirectToWebapp(c, providerName, "", url.Values{"error": {oauthErrInvalidState}})
		return
	}

	fail := func(code string) {
		db.Delete(&state)
		redirectToWebapp(c, providerName, state.Mode, url.Values{"error": {code}})
	}

	if c.Query("error") != "" || c.Query("code") == "" {
		fail(oauthErrDenied)
		return
	}

	profile, err := provider.Exchange(ctx, c.Query("code"), state.CodeVerifier)
	if err != nil {
		log.Printf("oauth: %v", err)
		fail(oauthErrProvider)
		return
	}

	var user models.User
	var errCode string
	if state.Mode == models.OAuthModeLink && state.UserID != nil {
		user, errCode = linkSocialAccount(db, *state.UserID, provider.Name(), profile)
	} else {
		user, errCode = loginWithSocialAccount(db, provider.Name(), profile)
	}
	if errCode != "" {
		fail(errCode)
		return
	}

	resultCode, err := services.GenerateSecureString(48)
	if err != nil {
		log.Printf("oauth: failed to generate result code: %v", err)
		fail(oauthErrInternal)
		return
	}
	resultHash := sha256Hex(resultCode)
	result := db.Model(&models.OAuthState{}).
		Where("id = ? AND result_code_hash IS NULL", state.ID).
		Updates(map[string]any{
			"result_code_hash": resultHash,
			"result_user_id":   user.ID,
			"expires_at":       time.Now().Add(oauthResultCodeTTL),
		})
	if result.Error != nil || result.RowsAffected == 0 {
		log.Printf("oauth: failed to store result: %v", result.Error)
		fail(oauthErrInternal)
		return
	}

	redirectToWebapp(c, providerName, state.Mode, url.Values{"code": {resultCode}})
}

type oauthExchangeRequest struct {
	Code  string `json:"code" binding:"required,max=255"`
	Nonce string `json:"nonce" binding:"required,max=255"`
}

// Exchange trades the result code (plus the browser nonce) for a JWT.
func (this *OAuthController) Exchange(c *gin.Context) {
	var req oauthExchangeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	db := bootstrap.DB.WithContext(c.Request.Context())
	invalid := func() {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired code"})
	}

	var state models.OAuthState
	err := db.Where("result_code_hash = ? AND expires_at > ?", sha256Hex(req.Code), time.Now()).Take(&state).Error
	if err != nil || state.ResultUserID == nil {
		invalid()
		return
	}

	// Single use: whoever deletes the row first wins.
	if result := db.Where("id = ?", state.ID).Delete(&models.OAuthState{}); result.Error != nil || result.RowsAffected == 0 {
		invalid()
		return
	}
	if subtle.ConstantTimeCompare([]byte(sha256Hex(req.Nonce)), []byte(state.NonceHash)) != 1 {
		invalid()
		return
	}

	var user models.User
	if err := db.Where("id = ?", *state.ResultUserID).Take(&user).Error; err != nil {
		invalid()
		return
	}

	payload, err := issueAuthToken(c, user)
	if err != nil {
		log.Printf("oauth: failed to sign token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	payload["mode"] = state.Mode
	payload["provider"] = state.Provider

	c.JSON(http.StatusOK, gin.H{"data": payload})
}

// ListSocialAccounts returns the providers linked to the authenticated user.
func (this *OAuthController) ListSocialAccounts(c *gin.Context) {
	user := c.MustGet("authenticatedUser").(models.User)

	accounts := []models.SocialAccount{}
	err := bootstrap.DB.WithContext(c.Request.Context()).
		Where("user_id = ?", user.ID).Order("provider").Find(&accounts).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	providers := gin.H{}
	for _, name := range []string{"google", "instagram"} {
		p, _ := services.GetOAuthProvider(name)
		providers[name] = p.Configured()
	}

	c.JSON(http.StatusOK, gin.H{"data": accounts, "meta": gin.H{"providers": providers}})
}

// UnlinkSocialAccount removes the link between the user and a provider.
func (this *OAuthController) UnlinkSocialAccount(c *gin.Context) {
	user := c.MustGet("authenticatedUser").(models.User)

	result := bootstrap.DB.WithContext(c.Request.Context()).
		Where("user_id = ? AND provider = ?", user.ID, c.Param("provider")).
		Delete(&models.SocialAccount{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

func loginWithSocialAccount(db *gorm.DB, provider string, profile *services.OAuthProfile) (models.User, string) {
	var user models.User

	var account models.SocialAccount
	err := db.Where("provider = ? AND provider_user_id = ?", provider, profile.ID).Take(&account).Error
	if err == nil {
		if err := db.Where("id = ?", account.UserID).Take(&user).Error; err != nil {
			log.Printf("oauth: linked user %d not found: %v", account.UserID, err)
			return user, oauthErrInternal
		}
		if profile.Username != "" && profile.Username != account.Username {
			db.Model(&account).Update("username", profile.Username)
		}
		return user, ""
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("oauth: failed to find social account: %v", err)
		return user, oauthErrInternal
	}

	// Providers without a verified e-mail (Instagram) can only log in to accounts linked beforehand.
	if profile.Email == "" {
		return user, oauthErrNotLinked
	}
	if !profile.EmailVerified {
		return user, oauthErrEmail
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		err := tx.Where("LOWER(email) = LOWER(?)", profile.Email).Take(&user).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Social-only account: the empty password never matches, the user can set one through password recovery.
			user = models.User{Name: profile.Name, Email: profile.Email}
			err = tx.Create(&user).Error
		}
		if err != nil {
			return err
		}
		return tx.Create(&models.SocialAccount{
			UserID:         user.ID,
			Provider:       provider,
			ProviderUserID: profile.ID,
			Username:       profile.Username,
		}).Error
	})
	if err != nil {
		log.Printf("oauth: failed to sign in with %s: %v", provider, err)
		return user, oauthErrInternal
	}

	return user, ""
}

func linkSocialAccount(db *gorm.DB, userID uint64, provider string, profile *services.OAuthProfile) (models.User, string) {
	var user models.User
	if err := db.Where("id = ?", userID).Take(&user).Error; err != nil {
		return user, oauthErrInvalidState
	}

	var existing models.SocialAccount
	err := db.Where("provider = ? AND provider_user_id = ?", provider, profile.ID).Take(&existing).Error
	if err == nil {
		if existing.UserID != userID {
			return user, oauthErrInUse
		}
		return user, ""
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("oauth: failed to find social account: %v", err)
		return user, oauthErrInternal
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		// A user has at most one account per provider: replace a previous link.
		if err := tx.Where("user_id = ? AND provider = ?", userID, provider).Delete(&models.SocialAccount{}).Error; err != nil {
			return err
		}
		return tx.Create(&models.SocialAccount{
			UserID:         userID,
			Provider:       provider,
			ProviderUserID: profile.ID,
			Username:       profile.Username,
		}).Error
	})
	if err != nil {
		log.Printf("oauth: failed to link %s: %v", provider, err)
		return user, oauthErrInternal
	}

	return user, ""
}

func redirectToWebapp(c *gin.Context, provider string, mode string, params url.Values) {
	params.Set("provider", provider)
	if mode != "" {
		params.Set("mode", mode)
	}
	c.Redirect(http.StatusFound, config.Get[string]("app.url")+"/oauth/callback?"+params.Encode())
}

func sha256Hex(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

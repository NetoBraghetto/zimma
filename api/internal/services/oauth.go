package services

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"zimma/internal/config"
)

// OAuthProfile is the identity returned by a provider after login.
type OAuthProfile struct {
	ID            string
	Email         string
	EmailVerified bool
	Name          string
	Username      string
}

type OAuthProvider interface {
	Name() string
	Configured() bool
	// AuthURL builds the provider consent URL. codeChallenge is ignored by providers without PKCE.
	AuthURL(state string, codeChallenge string) string
	Exchange(ctx context.Context, code string, codeVerifier string) (*OAuthProfile, error)
}

var oauthHTTPClient = &http.Client{Timeout: 10 * time.Second}

func GetOAuthProvider(name string) (OAuthProvider, bool) {
	switch name {
	case "google":
		return googleProvider{}, true
	case "instagram":
		return instagramProvider{}, true
	}
	return nil, false
}

func OAuthRedirectURI(provider string) string {
	return fmt.Sprintf("%s/auth/oauth/%s/callback", config.Get[string]("app.api_url"), provider)
}

// PKCEChallenge returns the S256 code challenge for a verifier.
func PKCEChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func oauthCredentials(provider string) (string, string) {
	return config.Get[string]("oauth." + provider + ".client_id"), config.Get[string]("oauth." + provider + ".client_secret")
}

func doJSON(req *http.Request, target any) error {
	res, err := oauthHTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return err
	}
	if res.StatusCode >= 400 {
		return fmt.Errorf("%s %s: status %d: %s", req.Method, req.URL.Host+req.URL.Path, res.StatusCode, string(body))
	}
	return json.Unmarshal(body, target)
}

func postForm(ctx context.Context, endpoint string, form url.Values, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	return doJSON(req, target)
}

// Google: OpenID Connect authorization code flow with PKCE.
type googleProvider struct{}

func (googleProvider) Name() string { return "google" }

func (googleProvider) Configured() bool {
	id, secret := oauthCredentials("google")
	return id != "" && secret != ""
}

func (p googleProvider) AuthURL(state string, codeChallenge string) string {
	clientID, _ := oauthCredentials("google")
	q := url.Values{
		"client_id":             {clientID},
		"redirect_uri":          {OAuthRedirectURI(p.Name())},
		"response_type":         {"code"},
		"scope":                 {"openid email profile"},
		"state":                 {state},
		"code_challenge":        {codeChallenge},
		"code_challenge_method": {"S256"},
		"prompt":                {"select_account"},
	}
	return "https://accounts.google.com/o/oauth2/v2/auth?" + q.Encode()
}

func (p googleProvider) Exchange(ctx context.Context, code string, codeVerifier string) (*OAuthProfile, error) {
	clientID, clientSecret := oauthCredentials("google")
	var token struct {
		AccessToken string `json:"access_token"`
	}
	err := postForm(ctx, "https://oauth2.googleapis.com/token", url.Values{
		"code":          {code},
		"client_id":     {clientID},
		"client_secret": {clientSecret},
		"redirect_uri":  {OAuthRedirectURI(p.Name())},
		"grant_type":    {"authorization_code"},
		"code_verifier": {codeVerifier},
	}, &token)
	if err != nil {
		return nil, fmt.Errorf("google token exchange: %w", err)
	}
	if token.AccessToken == "" {
		return nil, errors.New("google token exchange: empty access token")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://openidconnect.googleapis.com/v1/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	var info struct {
		Sub           string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		Name          string `json:"name"`
	}
	if err := doJSON(req, &info); err != nil {
		return nil, fmt.Errorf("google userinfo: %w", err)
	}
	if info.Sub == "" {
		return nil, errors.New("google userinfo: missing subject")
	}

	return &OAuthProfile{
		ID:            info.Sub,
		Email:         strings.TrimSpace(info.Email),
		EmailVerified: info.EmailVerified,
		Name:          info.Name,
		Username:      info.Email,
	}, nil
}

// Instagram: Business Login for Instagram. Works only with professional
// (business or creator) accounts and does not expose the user's e-mail.
type instagramProvider struct{}

func (instagramProvider) Name() string { return "instagram" }

func (instagramProvider) Configured() bool {
	id, secret := oauthCredentials("instagram")
	return id != "" && secret != ""
}

func (p instagramProvider) AuthURL(state string, _ string) string {
	clientID, _ := oauthCredentials("instagram")
	q := url.Values{
		"client_id":       {clientID},
		"redirect_uri":    {OAuthRedirectURI(p.Name())},
		"response_type":   {"code"},
		"scope":           {"instagram_business_basic"},
		"state":           {state},
		"enable_fb_login": {"false"},
	}
	return "https://www.instagram.com/oauth/authorize?" + q.Encode()
}

type instagramToken struct {
	AccessToken string          `json:"access_token"`
	UserID      json.RawMessage `json:"user_id"`
}

func (p instagramProvider) Exchange(ctx context.Context, code string, _ string) (*OAuthProfile, error) {
	clientID, clientSecret := oauthCredentials("instagram")
	// The documented response wraps the token in a "data" array; accept the flat shape too.
	var raw struct {
		Data []instagramToken `json:"data"`
		instagramToken
	}
	err := postForm(ctx, "https://api.instagram.com/oauth/access_token", url.Values{
		"client_id":     {clientID},
		"client_secret": {clientSecret},
		"grant_type":    {"authorization_code"},
		"redirect_uri":  {OAuthRedirectURI(p.Name())},
		"code":          {code},
	}, &raw)
	if err != nil {
		return nil, fmt.Errorf("instagram token exchange: %w", err)
	}
	token := raw.instagramToken
	if len(raw.Data) > 0 {
		token = raw.Data[0]
	}
	userID := strings.Trim(string(token.UserID), `"`)
	if token.AccessToken == "" || userID == "" {
		return nil, errors.New("instagram token exchange: missing access token or user id")
	}

	profile := &OAuthProfile{ID: userID}

	// Username is only used for display, so a failure here is not fatal.
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		"https://graph.instagram.com/me?fields=username&access_token="+url.QueryEscape(token.AccessToken), nil)
	if err == nil {
		var me struct {
			Username string `json:"username"`
		}
		if doJSON(req, &me) == nil {
			profile.Username = me.Username
		}
	}

	return profile, nil
}

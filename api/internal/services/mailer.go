package services

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"zimma/internal/config"
)

// SendMail sends a plain-text e-mail through the configured SMTP server.
// When MAIL_HOST is not set, the message is written to the log instead,
// which keeps local development working without an SMTP server.
func SendMail(to string, subject string, body string) error {
	host := config.Get[string]("mail.host")
	from := config.Get[string]("mail.from")

	if host == "" {
		log.Printf("[mail] MAIL_HOST not configured, logging message instead\nTo: %s\nSubject: %s\n\n%s", to, subject, body)
		return nil
	}

	port := config.Get[string]("mail.port")
	if port == "" {
		port = "25"
	}

	var auth smtp.Auth
	if username := config.Get[string]("mail.username"); username != "" {
		auth = smtp.PlainAuth("", username, config.Get[string]("mail.password"), host)
	}

	headers := []string{
		"From: " + from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=\"UTF-8\"",
	}
	message := strings.Join(headers, "\r\n") + "\r\n\r\n" + body

	if err := smtp.SendMail(fmt.Sprintf("%s:%s", host, port), auth, from, []string{to}, []byte(message)); err != nil {
		return fmt.Errorf("send mail: %w", err)
	}
	return nil
}

package controllers

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"zimma/internal/bootstrap"
	"zimma/internal/models"
	"zimma/internal/workers"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// Largest statement accepted by the preview.
const maxImportFileSize = 10 << 20

type ImportController struct{}

func NewImportController() *ImportController {
	return &ImportController{}
}

// Preview identifies the uploaded statement and returns its records for the user to review.
func (this *ImportController) Preview(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "Selecione um arquivo para importar."})
		return
	}
	if fileHeader.Size > maxImportFileSize {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "O arquivo deve ter no máximo 10MB."})
		return
	}

	tmp, err := os.CreateTemp("", "zimma-import-*")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	tmp.Close()
	defer os.Remove(tmp.Name())
	if err := c.SaveUploadedFile(fileHeader, tmp.Name()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	source, err := workers.DetectImportSource(tmp.Name())
	if err != nil {
		if errors.Is(err, workers.ErrUnsupportedImportFile) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "Arquivo não suportado. Envie um extrato bancário (.ofx) ou uma fatura de cartão (.xlsx) do Itaú.",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	records, err := workers.Import(c, source, tmp.Name())
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "Não foi possível ler o arquivo: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"source":       source,
			"source_label": workers.ImportSourceLabels[source],
			"records":      records,
		},
		"meta": gin.H{},
	})
}

type importRecord struct {
	Name         string          `json:"name" binding:"required,min=3,max=255"`
	Amount       decimal.Decimal `json:"amount" binding:"required"`
	Type         int             `json:"type" binding:"required,oneof=1 2"`
	DueDate      string          `json:"due_date" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
	PurchaseDate string          `json:"purchase_date" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	Confirmed    *bool           `json:"confirmed" binding:"required,boolean"`
	Tags         []uint64        `json:"tags" binding:"max=20"`
	Vendor       string          `json:"vendor" binding:"required,oneof=itau"`
	VendorSource string          `json:"vendor_source" binding:"required,oneof=itau-bank-extract itau-cc-extract"`
	VendorId     string          `json:"vendor_id" binding:"required,max=128"`
	VendorName   string          `json:"vendor_name" binding:"max=255"`
}

type storeImport struct {
	Records []importRecord `json:"records" binding:"required,min=1,max=2000,dive"`
}

// Store creates the reviewed records, skipping the ones the user already imported.
func (this *ImportController) Store(c *gin.Context) {
	var req storeImport
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	for _, record := range req.Records {
		if record.Amount.LessThan(decimal.Zero) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "amount must be greater than or equal to 0"})
			return
		}
	}

	type origin struct{ vendor, source string }
	idsByOrigin := map[origin][]string{}
	for _, record := range req.Records {
		key := origin{record.Vendor, record.VendorSource}
		idsByOrigin[key] = append(idsByOrigin[key], record.VendorId)
	}

	imported, skipped := 0, 0
	err := bootstrap.DB.WithContext(c).Transaction(func(tx *gorm.DB) error {
		existing := map[origin]map[string]bool{}
		for key, ids := range idsByOrigin {
			found, err := workers.ExistingVendorIds(c, key.vendor, key.source, ids)
			if err != nil {
				return err
			}
			existing[key] = found
		}

		for _, record := range req.Records {
			key := origin{record.Vendor, record.VendorSource}
			if existing[key][record.VendorId] {
				skipped++
				continue
			}
			// Also guards against the same entry sent twice in the request.
			existing[key][record.VendorId] = true

			dueDate, _ := time.Parse(time.RFC3339, record.DueDate)
			var purchaseDate *time.Time
			if record.PurchaseDate != "" {
				date, _ := time.Parse(time.RFC3339, record.PurchaseDate)
				purchaseDate = &date
			}
			serie := &models.FinancialRecordSerie{
				Name:         record.Name,
				Amount:       record.Amount,
				Type:         record.Type,
				RecurrenceId: models.FinancialRecordSerieRecurrence.UNIQUE,
				StartDate:    dueDate,
			}
			if err := tx.Create(serie).Error; err != nil {
				return err
			}

			tags, err := findTags(c, tx, record.Tags)
			if err != nil {
				return err
			}

			var confirmedAt *time.Time
			if *record.Confirmed {
				now := time.Now()
				confirmedAt = &now
			}
			vendor, source, vendorId := record.Vendor, record.VendorSource, record.VendorId
			var vendorName *string
			if name := strings.TrimSpace(record.VendorName); name != "" {
				vendorName = &name
			}
			financialRecord := &models.FinancialRecord{
				Name:                   record.Name,
				Amount:                 record.Amount,
				Type:                   record.Type,
				DueDate:                dueDate,
				PurchaseDate:           purchaseDate,
				ConfirmedAt:            confirmedAt,
				Installment:            1,
				Vendor:                 &vendor,
				VendorSource:           &source,
				VendorId:               &vendorId,
				VendorName:             vendorName,
				FinancialRecordSerieId: serie.ID,
				Tags:                   tags,
			}
			// "Tags.*" only links the existing tags instead of upserting them.
			if err := tx.Omit("Tags.*").Create(financialRecord).Error; err != nil {
				return err
			}
			imported++
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{"imported": imported, "skipped": skipped},
		"meta": gin.H{},
	})
}

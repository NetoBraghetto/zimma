package controllers

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"zimma/internal/bootstrap"
	"zimma/internal/enums"
	"zimma/internal/models"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TagController struct {
	RestfulController[models.Tag]
}

func NewTagController() *TagController {
	return &TagController{
		RestfulController: RestfulController[models.Tag]{
			builder: gorm.G[models.Tag](bootstrap.DB),
		},
	}
}

var tagSortableColumns = map[string]bool{"name": true, "created_at": true}

// tagOrder converts "$sort" (e.g. "name,-created_at") into an ORDER BY clause,
// ignoring columns that aren't sortable.
func tagOrder(sort string) string {
	order := []string{}
	for _, field := range strings.Split(sort, ",") {
		direction := "ASC"
		if strings.HasPrefix(field, "-") {
			direction = "DESC"
			field = field[1:]
		}
		if tagSortableColumns[field] {
			order = append(order, field+" "+direction)
		}
	}
	return strings.Join(append(order, "id"), ", ")
}

func (this *TagController) List(c *gin.Context) {
	ctx := context.Background()
	qs := services.QueryString[models.Tag]{}

	builder := this.getBuilder().Order(tagOrder(c.Query("$sort")))
	if q := strings.TrimSpace(c.Query("$q")); q != "" {
		builder = builder.Where("name ILIKE ?", "%"+q+"%")
	}

	page, _ := strconv.Atoi(
		c.DefaultQuery(string(enums.QueryStringParamKeyPage), "1"),
	)
	pageSize, _ := strconv.Atoi(
		c.DefaultQuery(string(enums.QueryStringParamKeyPageSize), "30"),
	)

	collection, pagination, err := qs.Paginate(
		builder,
		&services.QueryStringPaginationParams{Page: page, PageSize: pageSize},
		ctx,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": collection,
		"meta": gin.H{
			"pagination": pagination,
		},
	})
}

type saveTag struct {
	Name  string `json:"name" binding:"required,min=2,max=50"`
	Color string `json:"color" binding:"required,len=7,hexcolor"`
}

func (this *TagController) Store(c *gin.Context) {
	var req saveTag
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "req": req})
		return
	}

	created := &models.Tag{Name: req.Name, Color: req.Color}
	if err := bootstrap.DB.WithContext(c).Create(created).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func (this *TagController) Update(c *gin.Context) {
	var req saveTag
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "req": req})
		return
	}

	ctx := context.Background()
	resource, err := this.getBuilder().Where("id", c.Param("id")).Take(ctx)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "record not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	resource.Name = req.Name
	resource.Color = req.Color
	if err := bootstrap.DB.WithContext(c).Save(&resource).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resource})
}

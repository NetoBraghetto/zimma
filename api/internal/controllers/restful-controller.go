package controllers

import (
	"context"
	"net/http"
	"strconv"

	"zimma/internal/bootstrap"
	"zimma/internal/enums"
	"zimma/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// type IRestfulController[T any] interface {

// }

type RestfulController[T any] struct {
	builder gorm.Interface[T]
}

func (this *RestfulController[T]) getBuilder() gorm.Interface[T] {
	return this.builder
}

func (this *RestfulController[T]) List(c *gin.Context) {
	ctx := context.Background()
	qs := services.QueryString[T]{}

	page, _ := strconv.Atoi(
		c.DefaultQuery(string(enums.QueryStringParamKeyPage), "1"),
	)
	pageSize, _ := strconv.Atoi(
		c.DefaultQuery(string(enums.QueryStringParamKeyPageSize), "30"),
	)

	collection, pagination, err := qs.Paginate(
		this.getBuilder(),
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

func (this *RestfulController[T]) View(c *gin.Context) {
	ctx := context.Background()

	resource, err := this.getBuilder().Where("id", c.Param("id")).Take(ctx)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": resource,
		"meta": gin.H{},
	})
}

func (this *RestfulController[T]) Store(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
}

func (this *RestfulController[T]) Update(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
}

func (this *RestfulController[T]) Delete(c *gin.Context) {
	ctx := context.Background()

	resource, err := this.getBuilder().Where("id", c.Param("id")).Take(ctx)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	bootstrap.DB.Delete(&resource)

	c.Status(http.StatusNoContent)
}

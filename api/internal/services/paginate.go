package services

import (
	"context"

	"gorm.io/gorm"
)

type QueryStringPaginationParams struct {
	Page     int
	PageSize int
}

type QueryStringPaginationMeta struct {
	Page     int
	PageSize int
	Total    int
}

type QueryString[T any] struct{}

func (this *QueryString[T]) Paginate(
	builder gorm.Interface[T],
	params *QueryStringPaginationParams,
	ctx context.Context,
) ([]T, QueryStringPaginationMeta, error) {
	if params.PageSize <= 0 {
		params.PageSize = 30
	}
	count, _ := builder.Count(ctx, "id")

	pagination := QueryStringPaginationMeta{
		Page:     params.Page,
		PageSize: params.PageSize,
		Total:    int(count),
	}

	collection, err := builder.
		Limit(params.PageSize).
		Offset((params.Page - 1) * params.PageSize).
		Find(ctx)

	return collection, pagination, err
}

// func (this *QueryString[T]) Paginate(builder gorm.Interface[T], params QueryStringPaginationParams) gorm.Interface[T] {
// 	if params.PageSize <= 0 {
// 		params.PageSize = 30
// 	}

// 	builder.Limit(params.PageSize).Offset((params.Page - 1) * params.PageSize)
// 	return builder
// }

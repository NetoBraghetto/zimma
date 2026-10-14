package models

import (
	"reflect"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BelongsToUser struct {
	UserId uint64 `gorm:"index" json:"user_id"`
	User   User   `gorm:"foreignKey:UserId" json:"-"`
}

type belongsToUserModel interface {
	belongsToUser()
}

func (BelongsToUser) belongsToUser() {}

func (this *BelongsToUser) BeforeSave(tx *gorm.DB) error {
	if user, ok := tx.Statement.Context.Value("authenticatedUser").(User); ok {
		this.UserId = user.ID
	}
	return nil
}

// GORM does not provide a BeforeFind hook, so the select scope is registered as a query callback.
func RegisterBelongsToUserCallbacks(db *gorm.DB) error {
	return db.Callback().Query().Before("gorm:query").Register("belongs_to_user:scope", scopeByAuthenticatedUser)
}

func scopeByAuthenticatedUser(tx *gorm.DB) {
	if tx.Statement.Schema == nil || tx.Statement.Context == nil {
		return
	}
	if _, ok := reflect.New(tx.Statement.Schema.ModelType).Interface().(belongsToUserModel); !ok {
		return
	}
	user, ok := tx.Statement.Context.Value("authenticatedUser").(User)
	if !ok {
		return
	}
	tx.Statement.AddClause(clause.Where{Exprs: []clause.Expression{
		clause.Eq{Column: clause.Column{Table: clause.CurrentTable, Name: "user_id"}, Value: user.ID},
	}})
}

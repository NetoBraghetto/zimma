package enums

type TPaymentMethod = struct {
	PIX         string
	CASH        string
	CREDIT_CARD string
}

var PaymentMethod = &TPaymentMethod{
	PIX:         "pix",
	CASH:        "cash",
	CREDIT_CARD: "credit_card",
}

// NullablePaymentMethod converts an already validated payment method into the nullable column
// value: an empty string means it was not informed.
func NullablePaymentMethod(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

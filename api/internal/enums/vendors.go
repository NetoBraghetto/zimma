package enums

type TVendor = struct {
	ITAU   string
	INTER  string
	NUBANK string
	BB     string
	C6     string
}

var Vendor = &TVendor{
	ITAU:   "itau",
	INTER:  "inter",
	NUBANK: "nubank",
	BB:     "bb",
	C6:     "c6",
}

import type { FormatGeneralOptions } from "cleave-zen";

export const CleavePhoneOptions: FormatGeneralOptions = {
  blocks: [0, 2, 0, 4, 5],
  delimiters: ["(", ")", " ", "-"],
  numericOnly: true,
};

export const CleaveCpfOptions: FormatGeneralOptions = {
  blocks: [3, 3, 3, 2],
  delimiters: [".", ".", "-"],
  numericOnly: true,
};

export const CleaveCnpjOptions: FormatGeneralOptions = {
  blocks: [2, 3, 3, 4, 2],
  delimiters: [".", ".", "/", "-"],
  numericOnly: true,
};

// export const CleaveBRLOptions: FormatNumeralOptions = {
//   numeral: true,
//   numeralDecimalMark: ",",
//   numeralThousandsGroupStyle: "none",
//   delimiter: ".",
//   stripLeadingZeroes: false,
// };

// export const CleaveTimeOptions: FormatTimeOptions = {
//   time: true,
//   timePattern: ["h", "m"],
// };

// export const CleaveNumericOptions: FormatNumeralOptions = {
//   numeral: true,
// };

// export const CleaveKiloOptions: FormatNumeralOptions = {
//   numeral: true,
//   numeralDecimalMark: ",",
//   numeralThousandsGroupStyle: "none",
//   numeralDecimalScale: 3,
//   delimiter: ".",
//   stripLeadingZeroes: false,
// };

// export const CleaveZipCodeOptions: FormatGeneralOptions = {
//   blocks: [5, 3],
//   delimiters: ["-"],
//   numericOnly: true,
// };

export type ValueOf<T> = T[keyof T];

// export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type SqlDateFormat = `${number}-${number}-${number}`;
export type SqlTimeFormat = `${number}:${number}:${number}`;
export type SqlDateTimeFormat = `${SqlDateFormat}T${SqlTimeFormat}.000000Z`;
export type SqlDecimalFormat = `${number}.${number}`;

export type NullishString = string | null | undefined;

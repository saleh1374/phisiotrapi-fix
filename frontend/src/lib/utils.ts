/** Join class names, ignoring falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert latin digits in a string/number to Persian digits (۰-۹). */
export function faNum(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Format a number as a Persian (fa-IR) grouped number, e.g. ۱۲٬۵۰۰. */
export function faPrice(value: number): string {
  return faNum(new Intl.NumberFormat("fa-IR").format(value));
}

/** Format a date in the Jalali (Persian) calendar. */
export function faDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
  }).format(date);
}
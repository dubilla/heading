export function getQuarterFromMonth(month: number): number {
  if (month >= 1 && month <= 3) return 1;
  if (month >= 4 && month <= 6) return 2;
  if (month >= 7 && month <= 9) return 3;
  return 4;
}

export function getQuarterFromDate(date: Date): number {
  return getQuarterFromMonth(date.getMonth() + 1);
}

export function getMonthsForQuarter(quarter: number): number[] {
  switch (quarter) {
    case 1:
      return [1, 2, 3];
    case 2:
      return [4, 5, 6];
    case 3:
      return [7, 8, 9];
    case 4:
      return [10, 11, 12];
    default:
      return [];
  }
}

export function getQuarterEndDate(year: number, quarter: number): Date {
  const months = getMonthsForQuarter(quarter);
  const lastMonth = months[months.length - 1];
  return new Date(year, lastMonth, 0); // Last day of the month
}

export function getQuarterStartDate(year: number, quarter: number): Date {
  const months = getMonthsForQuarter(quarter);
  return new Date(year, months[0] - 1, 1);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getQuarterLabel(quarter: number): string {
  return `Q${quarter}`;
}

export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long" });
}

export function getCurrentQuarter(): number {
  return getQuarterFromDate(new Date());
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function isDateInQuarter(date: Date, quarter: number): boolean {
  return getQuarterFromDate(date) === quarter;
}

export function getDaysUntil(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function isOverdue(targetDate: Date): boolean {
  return getDaysUntil(targetDate) < 0;
}

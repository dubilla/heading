import {
  getQuarterFromMonth,
  getQuarterFromDate,
  getMonthsForQuarter,
  getQuarterEndDate,
  getQuarterStartDate,
  getQuarterLabel,
  getMonthName,
  getDaysUntil,
  isOverdue,
} from "@/lib/utils/date-helpers";

describe("getQuarterFromMonth", () => {
  it("returns Q1 for January-March", () => {
    expect(getQuarterFromMonth(1)).toBe(1);
    expect(getQuarterFromMonth(2)).toBe(1);
    expect(getQuarterFromMonth(3)).toBe(1);
  });

  it("returns Q2 for April-June", () => {
    expect(getQuarterFromMonth(4)).toBe(2);
    expect(getQuarterFromMonth(5)).toBe(2);
    expect(getQuarterFromMonth(6)).toBe(2);
  });

  it("returns Q3 for July-September", () => {
    expect(getQuarterFromMonth(7)).toBe(3);
    expect(getQuarterFromMonth(8)).toBe(3);
    expect(getQuarterFromMonth(9)).toBe(3);
  });

  it("returns Q4 for October-December", () => {
    expect(getQuarterFromMonth(10)).toBe(4);
    expect(getQuarterFromMonth(11)).toBe(4);
    expect(getQuarterFromMonth(12)).toBe(4);
  });
});

describe("getQuarterFromDate", () => {
  it("returns correct quarter for various dates", () => {
    expect(getQuarterFromDate(new Date(2025, 0, 15))).toBe(1); // Jan 15
    expect(getQuarterFromDate(new Date(2025, 4, 1))).toBe(2); // May 1
    expect(getQuarterFromDate(new Date(2025, 7, 31))).toBe(3); // Aug 31
    expect(getQuarterFromDate(new Date(2025, 11, 25))).toBe(4); // Dec 25
  });
});

describe("getMonthsForQuarter", () => {
  it("returns correct months for each quarter", () => {
    expect(getMonthsForQuarter(1)).toEqual([1, 2, 3]);
    expect(getMonthsForQuarter(2)).toEqual([4, 5, 6]);
    expect(getMonthsForQuarter(3)).toEqual([7, 8, 9]);
    expect(getMonthsForQuarter(4)).toEqual([10, 11, 12]);
  });

  it("returns empty array for invalid quarter", () => {
    expect(getMonthsForQuarter(0)).toEqual([]);
    expect(getMonthsForQuarter(5)).toEqual([]);
  });
});

describe("getQuarterEndDate", () => {
  it("returns last day of quarter", () => {
    expect(getQuarterEndDate(2025, 1).getMonth()).toBe(2); // March
    expect(getQuarterEndDate(2025, 1).getDate()).toBe(31);

    expect(getQuarterEndDate(2025, 2).getMonth()).toBe(5); // June
    expect(getQuarterEndDate(2025, 2).getDate()).toBe(30);

    expect(getQuarterEndDate(2025, 3).getMonth()).toBe(8); // September
    expect(getQuarterEndDate(2025, 3).getDate()).toBe(30);

    expect(getQuarterEndDate(2025, 4).getMonth()).toBe(11); // December
    expect(getQuarterEndDate(2025, 4).getDate()).toBe(31);
  });
});

describe("getQuarterStartDate", () => {
  it("returns first day of quarter", () => {
    const q1Start = getQuarterStartDate(2025, 1);
    expect(q1Start.getMonth()).toBe(0); // January
    expect(q1Start.getDate()).toBe(1);

    const q2Start = getQuarterStartDate(2025, 2);
    expect(q2Start.getMonth()).toBe(3); // April
    expect(q2Start.getDate()).toBe(1);
  });
});

describe("getQuarterLabel", () => {
  it("returns formatted quarter label", () => {
    expect(getQuarterLabel(1)).toBe("Q1");
    expect(getQuarterLabel(2)).toBe("Q2");
    expect(getQuarterLabel(3)).toBe("Q3");
    expect(getQuarterLabel(4)).toBe("Q4");
  });
});

describe("getMonthName", () => {
  it("returns full month name", () => {
    expect(getMonthName(1)).toBe("January");
    expect(getMonthName(6)).toBe("June");
    expect(getMonthName(12)).toBe("December");
  });
});

describe("getDaysUntil", () => {
  it("returns positive days for future dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    expect(getDaysUntil(futureDate)).toBe(10);
  });

  it("returns negative days for past dates", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    expect(getDaysUntil(pastDate)).toBe(-5);
  });

  it("returns 0 for today", () => {
    const today = new Date();
    expect(getDaysUntil(today)).toBe(0);
  });
});

describe("isOverdue", () => {
  it("returns true for past dates", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(isOverdue(pastDate)).toBe(true);
  });

  it("returns false for today and future dates", () => {
    const today = new Date();
    expect(isOverdue(today)).toBe(false);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(isOverdue(futureDate)).toBe(false);
  });
});

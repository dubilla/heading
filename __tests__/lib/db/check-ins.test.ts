import { updateCurrentWeekCheckIn } from "@/lib/db/check-ins";
import { db } from "@/lib/db";
import { getWeekStartDate } from "@/lib/utils/week-helpers";

jest.mock("@/lib/db", () => ({
  db: {
    query: {
      checkIns: { findFirst: jest.fn(), findMany: jest.fn() },
    },
    update: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  query: { checkIns: { findFirst: jest.Mock; findMany: jest.Mock } };
  update: jest.Mock;
};

const userId = crypto.randomUUID();
const checkInId = crypto.randomUUID();

const updateData = {
  accomplishments: "Shipped five PRs",
  challenges: "Context switching",
  nextWeekPriorities: "Slice 15",
  needsAdjustment: false,
};

function mockUpdateReturning(row: unknown) {
  mockDb.update.mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(row ? [row] : []),
      }),
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateCurrentWeekCheckIn", () => {
  it("updates the current week's check-in", async () => {
    const existing = {
      id: checkInId,
      userId,
      weekStartDate: getWeekStartDate(),
    };
    mockDb.query.checkIns.findFirst.mockResolvedValue(existing);
    const updated = { ...existing, ...updateData };
    mockUpdateReturning(updated);

    const result = await updateCurrentWeekCheckIn(
      checkInId,
      userId,
      updateData
    );

    expect(result).toEqual(updated);
  });

  it("refuses to amend a past week's check-in", async () => {
    mockDb.query.checkIns.findFirst.mockResolvedValue({
      id: checkInId,
      userId,
      weekStartDate: new Date("2026-01-04"),
    });

    const result = await updateCurrentWeekCheckIn(
      checkInId,
      userId,
      updateData
    );

    expect(result).toBe("not_current_week");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns null for a check-in that isn't the caller's", async () => {
    // Owner scoping happens in the where clause; an unmatched row resolves to
    // undefined.
    mockDb.query.checkIns.findFirst.mockResolvedValue(undefined);

    const result = await updateCurrentWeekCheckIn(
      checkInId,
      userId,
      updateData
    );

    expect(result).toBeNull();
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

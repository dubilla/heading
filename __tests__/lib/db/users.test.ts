import { changeUserPassword, updateUserProfile } from "@/lib/db/users";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

jest.mock("@/lib/db", () => ({
  db: {
    query: {
      users: { findFirst: jest.fn() },
    },
    update: jest.fn(),
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(async () => "hashed-new-password"),
}));

const mockDb = db as unknown as {
  query: { users: { findFirst: jest.Mock } };
  update: jest.Mock;
};

const userId = crypto.randomUUID();

function mockUpdateReturning(row: unknown) {
  const returning = jest.fn().mockResolvedValue(row ? [row] : []);
  const where = jest.fn().mockReturnValue({ returning });
  // changeUserPassword's update chain ends at .where() without .returning(),
  // so where() must also resolve as a promise.
  where.mockReturnValue(
    Object.assign(Promise.resolve(row ? [row] : []), { returning })
  );
  mockDb.update.mockReturnValue({
    set: jest.fn().mockReturnValue({ where }),
  });
  return { where };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateUserProfile", () => {
  it("updates name and check-in day", async () => {
    const row = { id: userId, name: "Dan", checkInDay: 6 };
    mockUpdateReturning(row);

    const result = await updateUserProfile(userId, {
      name: "Dan",
      checkInDay: 6,
    });

    expect(result).toEqual(row);
  });
});

describe("changeUserPassword", () => {
  it("rejects when the user has no password (OAuth account)", async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: userId,
      password: null,
    });

    const result = await changeUserPassword(userId, "anything", "new-pass-123");

    expect(result).toBe("no_password");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("rejects when the current password is wrong", async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: userId,
      password: "stored-hash",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await changeUserPassword(userId, "wrong", "new-pass-123");

    expect(result).toBe("wrong_password");
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("hashes and stores the new password when the current one matches", async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: userId,
      password: "stored-hash",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockUpdateReturning({ id: userId });

    const result = await changeUserPassword(userId, "correct", "new-pass-123");

    expect(result).toBe("ok");
    expect(bcrypt.hash).toHaveBeenCalledWith("new-pass-123", 10);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("reports a missing user", async () => {
    mockDb.query.users.findFirst.mockResolvedValue(undefined);

    const result = await changeUserPassword(userId, "x", "new-pass-123");

    expect(result).toBe("not_found");
  });
});

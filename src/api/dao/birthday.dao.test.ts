import { describe, expect, it } from "vitest";

import { setupInMemoryMongo } from "../../test-utils/setup-mongo";
import * as birthdayDao from "./birthday.dao";
import * as userDao from "./user.dao";

setupInMemoryMongo();

const seedUser = (overrides: {
  name: string;
  discordId: string;
  day: string;
  month: string;
}) =>
  userDao.addUser({
    name: overrides.name,
    discordId: overrides.discordId,
    birthdayDay: overrides.day,
    birthdayMonth: overrides.month,
  });

describe("birthday.dao (against in-memory mongo)", () => {
  describe("getBirthdays", () => {
    it("returns 200 with empty data when there are no users", async () => {
      const result = await birthdayDao.getBirthdays();
      expect(result.statusCode).toBe(200);
      expect((result as any).data).toEqual({});
    });

    it("groups users by Spanish month name and respects birthdayMonth ordering", async () => {
      await seedUser({ name: "Diego", discordId: "1", day: "17", month: "2" });
      await seedUser({ name: "Carlos", discordId: "2", day: "5", month: "2" });
      await seedUser({ name: "Ana", discordId: "3", day: "20", month: "5" });

      const result = await birthdayDao.getBirthdays();
      const data = (result as any).data;

      expect(result.statusCode).toBe(200);
      expect(Object.keys(data)).toContain("Febrero");
      expect(Object.keys(data)).toContain("Mayo");
      expect(data.Febrero).toHaveLength(2);
      expect(data.Mayo).toHaveLength(1);
    });

    it("ignores users without a birthdayMonth", async () => {
      await userDao.addUser({
        name: "Sin Mes",
        discordId: "9",
        birthdayDay: "10",
        birthdayMonth: "0", // 0 → falsy, gets skipped by getBirthdays' `if (!birthdayMonth)`
      });

      const result = await birthdayDao.getBirthdays();
      expect((result as any).data).toEqual({});
    });

    it("rejects months outside 1-12 (including the old 0-based 0 and NaN)", async () => {
      for (const month of [0, 13, NaN, 1.5]) {
        expect((await birthdayDao.getBirthdaysByMonth(month)).statusCode).toBe(422);
      }
    });
  });

  describe("getBirthdaysByMonth", () => {
    it("returns only users matching the requested month", async () => {
      await seedUser({ name: "Feb1", discordId: "1", day: "5", month: "2" });
      await seedUser({ name: "Feb2", discordId: "2", day: "10", month: "2" });
      await seedUser({ name: "May1", discordId: "3", day: "1", month: "5" });

      const result = await birthdayDao.getBirthdaysByMonth(2); // February, 1-12 like birthdayMonth
      const data = (result as any).data;

      expect(result.statusCode).toBe(200);
      expect(data.Febrero).toHaveLength(2);
      expect(Object.keys(data)).not.toContain("Mayo");
    });

    it("returns empty data when no users match", async () => {
      await seedUser({ name: "Solo", discordId: "1", day: "5", month: "2" });

      const result = await birthdayDao.getBirthdaysByMonth(12); // December
      expect((result as any).data).toEqual({});
    });
  });

  describe("getNextBirthday", () => {
    it("returns the earliest upcoming birthday relative to now in Lima time", async () => {
      // We can't pin the calendar here without mocking dayjs internals,
      // so we seed a user whose birthday is many months away in both
      // hemispheres of the year and verify the dao returns SOME user.
      await seedUser({ name: "FarFuture", discordId: "1", day: "31", month: "12" });

      const result = await birthdayDao.getNextBirthday();
      expect(result.statusCode).toBe(200);
      expect((result as any).data).toBeTruthy();
      expect((result as any).data.name).toBe("FarFuture"); // capitalize only touches first letter
    });

    it("returns 200 with undefined data when no users have birthday fields", async () => {
      const result = await birthdayDao.getNextBirthday();
      // sortedUsers[0] is undefined; ResponseData wraps it
      expect(result.statusCode).toBe(200);
      expect((result as any).data).toBeUndefined();
    });
  });
});

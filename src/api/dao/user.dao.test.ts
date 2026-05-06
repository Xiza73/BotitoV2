import { describe, expect, it } from "vitest";

import { setupInMemoryMongo } from "../../test-utils/setup-mongo";
import User from "../models/User";
import * as userDao from "./user.dao";

setupInMemoryMongo();

const validBody = {
  name: "Diego",
  discordId: "111",
  birthdayDay: "17",
  birthdayMonth: "2",
};

describe("user.dao (against in-memory mongo)", () => {
  describe("addUser", () => {
    it("returns 200 and persists the user on a complete body", async () => {
      const result = await userDao.addUser(validBody);
      expect(result.statusCode).toBe(200);

      const stored = await User.findOne({ name: "Diego" });
      expect(stored).toBeTruthy();
      expect(stored?.birthdayDay).toBe(17);
      expect(stored?.birthdayMonth).toBe(2);
      expect(stored?.discordId).toBe("111");
    });

    it("capitalizes the name on insertion", async () => {
      await userDao.addUser({ ...validBody, name: "diego" });
      const stored = await User.findOne({ name: "Diego" });
      expect(stored).toBeTruthy();
    });

    it("returns 422 when required fields are missing", async () => {
      const result = await userDao.addUser({
        name: "",
        birthdayDay: "17",
        birthdayMonth: "2",
      } as any);
      expect(result.statusCode).toBe(422);
    });
  });

  describe("readUsers", () => {
    it("returns 200 with all inserted users", async () => {
      await userDao.addUser(validBody);
      await userDao.addUser({
        ...validBody,
        name: "Carlos",
        discordId: "222",
      });

      const result = await userDao.readUsers();
      expect(result.statusCode).toBe(200);
      expect((result as any).data).toHaveLength(2);
    });

    it("returns 200 with an empty array when there are no users", async () => {
      const result = await userDao.readUsers();
      expect(result.statusCode).toBe(200);
      expect((result as any).data).toEqual([]);
    });
  });

  describe("readUserByName", () => {
    it("returns 200 with the matching user (case-insensitive)", async () => {
      await userDao.addUser(validBody);

      const result = await userDao.readUserByName("diego");
      expect(result.statusCode).toBe(200);
      expect((result as any).data.name).toBe("Diego");
    });

    it("returns 400 when the name doesn't match any user", async () => {
      const result = await userDao.readUserByName("Inexistente");
      expect(result.statusCode).toBe(400);
    });

    it("returns 400 when called with an empty name", async () => {
      const result = await userDao.readUserByName("");
      expect(result.statusCode).toBe(400);
    });
  });

  describe("readUserByDiscordId", () => {
    it("returns 200 with the matching user", async () => {
      await userDao.addUser(validBody);

      const result = await userDao.readUserByDiscordId("111");
      expect(result.statusCode).toBe(200);
      expect((result as any).data.name).toBe("Diego");
    });

    it("returns 400 when the discordId doesn't match", async () => {
      const result = await userDao.readUserByDiscordId("nope");
      expect(result.statusCode).toBe(400);
    });

    it("returns 400 when called with an empty discordId", async () => {
      const result = await userDao.readUserByDiscordId("");
      expect(result.statusCode).toBe(400);
    });
  });

  describe("setDiscordId", () => {
    it("updates the discordId for a user matched by name", async () => {
      await userDao.addUser({ ...validBody, discordId: "old" });

      const result = await userDao.setDiscordId({
        name: "Diego",
        id: "new",
      });
      expect(result.statusCode).toBe(200);

      const stored = await User.findOne({ name: "Diego" });
      expect(stored?.discordId).toBe("new");
    });

    it("returns 422 on missing name or id", async () => {
      const result = await userDao.setDiscordId({ name: "", id: "x" });
      expect(result.statusCode).toBe(422);
    });
  });

  describe("setBirthday", () => {
    it("updates birthdayDay and birthdayMonth by name", async () => {
      await userDao.addUser(validBody);

      const result = await userDao.setBirthday({
        name: "Diego",
        day: 25,
        month: 12,
      });
      expect(result.statusCode).toBe(200);

      const stored = await User.findOne({ name: "Diego" });
      expect(stored?.birthdayDay).toBe(25);
      expect(stored?.birthdayMonth).toBe(12);
    });

    it("returns 422 on missing fields", async () => {
      const result = await userDao.setBirthday({
        name: "",
        day: 0,
        month: 0,
      });
      expect(result.statusCode).toBe(422);
    });
  });

  describe("deleteUser", () => {
    it("removes the user with the given _id", async () => {
      await userDao.addUser(validBody);
      const stored = await User.findOne({ name: "Diego" });

      const result = await userDao.deleteUser(stored!._id.toString());
      expect(result.statusCode).toBe(200);

      const after = await User.findOne({ name: "Diego" });
      expect(after).toBeNull();
    });

    it("returns 422 when called with an empty id", async () => {
      const result = await userDao.deleteUser("");
      expect(result.statusCode).toBe(422);
    });
  });

  describe("getCurrentMessary / updateMonth", () => {
    it("updateMonth sets user.month and getCurrentMessary reads it back", async () => {
      await userDao.addUser(validBody);

      const update = await userDao.updateMonth("111", 7);
      expect(update.statusCode).toBe(200);

      const read = await userDao.getCurrentMessary("111");
      expect(read.statusCode).toBe(200);
      expect((read as any).data).toBe(7);
    });

    it("getCurrentMessary returns 422 on empty discordId", async () => {
      const result = await userDao.getCurrentMessary("");
      expect(result.statusCode).toBe(422);
    });

    it("getCurrentMessary returns 400 when the user doesn't exist", async () => {
      const result = await userDao.getCurrentMessary("nope");
      expect(result.statusCode).toBe(400);
    });

    it("updateMonth returns 422 on empty discordId or zero month", async () => {
      const a = await userDao.updateMonth("", 5);
      expect(a.statusCode).toBe(422);

      const b = await userDao.updateMonth("111", 0);
      expect(b.statusCode).toBe(422);
    });
  });
});

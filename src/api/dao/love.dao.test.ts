import { describe, expect, it } from "vitest";

import { setupInMemoryMongo } from "../../test-utils/setup-mongo";
import * as loveDao from "./love.dao";

setupInMemoryMongo();

describe("love.dao (against in-memory mongo)", () => {
  describe("buildPairKey + computeAutoPercentage", () => {
    it("buildPairKey is order-independent", () => {
      expect(loveDao.buildPairKey("a", "b")).toBe(loveDao.buildPairKey("b", "a"));
    });

    it("buildPairKey sorts lexicographically", () => {
      expect(loveDao.buildPairKey("zzz", "aaa")).toBe("aaa-zzz");
    });

    it("computeAutoPercentage returns the same value for the same pair", () => {
      const a = loveDao.computeAutoPercentage("user-a", "user-b");
      const b = loveDao.computeAutoPercentage("user-b", "user-a");
      expect(a).toBe(b);
    });

    it("computeAutoPercentage stays in [0, 100]", () => {
      for (let i = 0; i < 100; i++) {
        const pct = loveDao.computeAutoPercentage(`a${i}`, `b${i}`);
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("getOrCreatePair", () => {
    it("creates a row with the auto-computed percentage on first call", async () => {
      const result = await loveDao.getOrCreatePair("u1", "u2");
      expect(result.statusCode).toBe(200);
      const data = (result as any).data;
      expect(data.user1).toBe("u1");
      expect(data.user2).toBe("u2");
      expect(data.percentage).toBe(loveDao.computeAutoPercentage("u1", "u2"));
      expect(data.isOverride).toBe(false);
      expect(data.verdict).toBeNull();
    });

    it("returns the same row on the second call (no duplicate inserts)", async () => {
      const first = await loveDao.getOrCreatePair("u1", "u2");
      const second = await loveDao.getOrCreatePair("u1", "u2");
      expect((first as any).data._id.toString()).toBe(
        (second as any).data._id.toString()
      );
    });

    it("normalizes argument order via the pairKey", async () => {
      await loveDao.getOrCreatePair("u1", "u2");
      const flipped = await loveDao.getOrCreatePair("u2", "u1");
      expect((flipped as any).data.pairKey).toBe(
        loveDao.buildPairKey("u1", "u2")
      );
    });

    it("returns 400 when an ID is missing", async () => {
      const result = await loveDao.getOrCreatePair("", "u2");
      expect(result.statusCode).toBe(400);
    });
  });

  describe("setOverride", () => {
    it("creates the row and marks it as overridden when no row exists yet", async () => {
      const result = await loveDao.setOverride(
        "u1",
        "u2",
        88,
        "Tortolitos del server",
        "owner-1"
      );
      expect(result.statusCode).toBe(200);
      const data = (result as any).data;
      expect(data.percentage).toBe(88);
      expect(data.verdict).toBe("Tortolitos del server");
      expect(data.isOverride).toBe(true);
      expect(data.setBy).toBe("owner-1");
    });

    it("upgrades an auto-populated row to an override", async () => {
      await loveDao.getOrCreatePair("u1", "u2"); // auto row first
      const result = await loveDao.setOverride("u1", "u2", 50, null, "owner-1");
      const data = (result as any).data;
      expect(data.percentage).toBe(50);
      expect(data.isOverride).toBe(true);
      expect(data.verdict).toBeNull();
    });

    it("rejects out-of-range percentages", async () => {
      const high = await loveDao.setOverride("u1", "u2", 101, null, "owner-1");
      const low = await loveDao.setOverride("u1", "u2", -5, null, "owner-1");
      expect(high.statusCode).toBe(422);
      expect(low.statusCode).toBe(422);
    });
  });

  describe("resetPair", () => {
    it("removes an existing pair so it can be auto-computed again", async () => {
      await loveDao.setOverride("u1", "u2", 88, "Custom", "owner-1");

      const reset = await loveDao.resetPair("u1", "u2");
      expect(reset.statusCode).toBe(200);

      const recreated = await loveDao.getOrCreatePair("u1", "u2");
      const data = (recreated as any).data;
      expect(data.isOverride).toBe(false);
      expect(data.percentage).toBe(loveDao.computeAutoPercentage("u1", "u2"));
    });

    it("returns 404 when the pair never existed", async () => {
      const reset = await loveDao.resetPair("ghost1", "ghost2");
      expect(reset.statusCode).toBe(404);
    });
  });
});

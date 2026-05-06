import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getDate, getNewDate } from "./dayjs";

const FIXED_UTC = new Date(Date.UTC(2026, 4, 6, 18, 0, 0)); // 2026-05-06 18:00 UTC

describe("dayjs helpers (with fixed system time)", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_UTC);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("getNewDate(city)", () => {
    it("returns a dayjs in the requested city's timezone", () => {
      const d = getNewDate("lima");
      // Lima is UTC-5, so 18:00 UTC → 13:00 Lima
      expect(d.hour()).toBe(13);
      expect(d.date()).toBe(6);
      expect(d.month()).toBe(4); // May (0-indexed)
      expect(d.year()).toBe(2026);
    });
  });

  describe("getDate({...})", () => {
    it("overrides the fields it's given and keeps the rest from getNewDate", () => {
      const d = getDate({ city: "lima", hours: 9, minutes: 30 });
      expect(d.hour()).toBe(9);
      expect(d.minute()).toBe(30);
      expect(d.second()).toBe(0); // default override to 0
      expect(d.millisecond()).toBe(0); // default override to 0
      expect(d.date()).toBe(6); // unchanged from getNewDate
    });

    it("supports a custom date number", () => {
      const d = getDate({ city: "lima", date: 25 });
      expect(d.date()).toBe(25);
      expect(d.month()).toBe(4); // unchanged
    });
  });
});

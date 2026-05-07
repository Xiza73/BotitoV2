import { describe, expect, it } from "vitest";

import {
  capitalize,
  dateToUTC5,
  formatUptime,
  mentionUser,
  random,
  rangeHandler,
  setParams,
  shuffle,
} from "./helpers";

describe("helpers — pure functions", () => {
  describe("random(min, max)", () => {
    it("returns an integer within [min, max] (inclusive)", () => {
      for (let i = 0; i < 200; i++) {
        const r = random(3, 7);
        expect(Number.isInteger(r)).toBe(true);
        expect(r).toBeGreaterThanOrEqual(3);
        expect(r).toBeLessThanOrEqual(7);
      }
    });

    it("returns the only possible value when min === max", () => {
      expect(random(5, 5)).toBe(5);
    });
  });

  describe("capitalize(str)", () => {
    it("uppercases the first letter of a single word", () => {
      expect(capitalize("hola")).toBe("Hola");
    });

    it("uppercases the first letter of every space-separated word", () => {
      expect(capitalize("hola mundo cruel")).toBe("Hola Mundo Cruel");
    });

    it("leaves an already-capitalized word alone", () => {
      expect(capitalize("Hola")).toBe("Hola");
    });

    it("returns an empty string when given empty input", () => {
      expect(capitalize("")).toBe("");
    });
  });

  describe("setParams(params)", () => {
    it("builds a single key=value query string with leading '?'", () => {
      expect(setParams({ foo: "bar" })).toBe("?foo=bar");
    });

    it("joins multiple keys with '&'", () => {
      expect(setParams({ foo: "bar", baz: 42 })).toBe("?foo=bar&baz=42");
    });

    it("supports boolean values", () => {
      expect(setParams({ flag: true })).toBe("?flag=true");
    });
  });

  describe("dateToUTC5(date)", () => {
    it("subtracts 5 hours from a UTC date past 05:00", () => {
      // 2026-01-15 12:00:00 UTC → 2026-01-15 07:00 in UTC-5
      const utc = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));
      const result = dateToUTC5(utc);
      expect(result.year).toBe(2026);
      expect(result.month).toBe(1); // january, +1 from getUTCMonth
      expect(result.day).toBe(15);
      expect(result.hours).toBe(7);
    });

    it("rolls back the day when UTC hours < 5 (puts hours into 19-23 range of previous day)", () => {
      // 2026-01-15 03:00:00 UTC → 2026-01-14 22:00 in UTC-5
      const utc = new Date(Date.UTC(2026, 0, 15, 3, 0, 0));
      const result = dateToUTC5(utc);
      expect(result.day).toBe(14);
      expect(result.hours).toBe(22); // 3 + 19 = 22
    });
  });

  describe("shuffle(array)", () => {
    it("returns an array with the same length and same elements as the input", () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = shuffle([...input]);

      expect(result).toHaveLength(input.length);
      expect([...result].sort((a, b) => a - b)).toEqual(input);
    });

    it("handles empty input", () => {
      expect(shuffle([])).toEqual([]);
    });

    it("does NOT mutate the input array", () => {
      const input = [1, 2, 3, 4, 5];
      const snapshot = [...input];
      shuffle(input);
      expect(input).toEqual(snapshot);
    });

    it("returns a new array reference", () => {
      const input = [1, 2, 3];
      expect(shuffle(input)).not.toBe(input);
    });
  });

  describe("mentionUser(id)", () => {
    it("wraps the id in the bold-mention markdown format", () => {
      expect(mentionUser("123456789")).toBe("**<@123456789>**");
    });
  });

  describe("formatUptime(seconds)", () => {
    it("returns just seconds when below a minute", () => {
      expect(formatUptime(0)).toBe("0s");
      expect(formatUptime(45)).toBe("45s");
      expect(formatUptime(59)).toBe("59s");
    });

    it("returns minutes + seconds when below an hour", () => {
      expect(formatUptime(60)).toBe("1m 0s");
      expect(formatUptime(125)).toBe("2m 5s");
      expect(formatUptime(3599)).toBe("59m 59s");
    });

    it("returns hours + minutes when below a day", () => {
      expect(formatUptime(3600)).toBe("1h 0m");
      expect(formatUptime(3660)).toBe("1h 1m");
      expect(formatUptime(86399)).toBe("23h 59m");
    });

    it("returns days + hours + minutes for >= 1 day", () => {
      expect(formatUptime(86400)).toBe("1d 0h 0m");
      expect(formatUptime(86400 + 3600 + 60)).toBe("1d 1h 1m");
      expect(formatUptime(2 * 86400 + 5 * 3600 + 30 * 60)).toBe("2d 5h 30m");
    });

    it("guards against invalid input", () => {
      expect(formatUptime(-5)).toBe("0s");
      expect(formatUptime(NaN)).toBe("0s");
      expect(formatUptime(Infinity)).toBe("0s");
    });

    it("floors fractional seconds", () => {
      expect(formatUptime(45.7)).toBe("45s");
      expect(formatUptime(125.99)).toBe("2m 5s");
    });
  });

  describe("rangeHandler(value, min, max)", () => {
    it("returns the value when it's within range", () => {
      expect(rangeHandler(5, 1, 10)).toBe(5);
    });

    it("clamps values above max to max", () => {
      expect(rangeHandler(99, 1, 10)).toBe(10);
    });

    it("clamps values below min to min", () => {
      expect(rangeHandler(-5, 1, 10)).toBe(1);
    });

    it("returns min when value === min and max when value === max", () => {
      expect(rangeHandler(1, 1, 10)).toBe(1);
      expect(rangeHandler(10, 1, 10)).toBe(10);
    });
  });
});

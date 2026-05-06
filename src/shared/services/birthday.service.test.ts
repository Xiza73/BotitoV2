import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/dao/birthday.dao");

import * as birthdayDao from "../../api/dao/birthday.dao";
import * as service from "./birthday.service";

const okResponse = (data: unknown) => ({
  statusCode: 200,
  message: "ok",
  data,
});

const errorResponse = (statusCode: number, message: string) => ({
  statusCode,
  message,
});

describe("birthday.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBirthdays", () => {
    it("returns the .data field on a 200 response", async () => {
      const sampleData = {
        Enero: [{ name: "Diego", discordId: "123", birthdayDay: 17 }],
      };
      vi.mocked(birthdayDao.getBirthdays).mockResolvedValue(
        okResponse(sampleData) as any
      );

      const result = await service.getBirthdays();

      expect(result).toEqual(sampleData);
      expect(birthdayDao.getBirthdays).toHaveBeenCalledOnce();
    });

    it("returns an empty object (not throws) on a non-200 response", async () => {
      vi.mocked(birthdayDao.getBirthdays).mockResolvedValue(
        errorResponse(404, "Error al obtener los cumpleaños") as any
      );

      const result = await service.getBirthdays();

      expect(result).toEqual({});
    });
  });

  describe("getBirthdaysByMonth", () => {
    it("returns the .data field on a 200 response", async () => {
      const sampleData = {
        Febrero: [{ name: "Carlos", discordId: "456", birthdayDay: 5 }],
      };
      vi.mocked(birthdayDao.getBirthdaysByMonth).mockResolvedValue(
        okResponse(sampleData) as any
      );

      const result = await service.getBirthdaysByMonth(1);

      expect(result).toEqual(sampleData);
      expect(birthdayDao.getBirthdaysByMonth).toHaveBeenCalledWith(1);
    });

    it("returns an empty object (not throws) on a non-200 response", async () => {
      vi.mocked(birthdayDao.getBirthdaysByMonth).mockResolvedValue(
        errorResponse(404, "Error") as any
      );

      const result = await service.getBirthdaysByMonth(11);

      expect(result).toEqual({});
    });
  });

  describe("getNextBirthday", () => {
    it("returns the .data field on a 200 response", async () => {
      const next = {
        name: "Diego",
        discordId: "123",
        birthdayDay: 17,
        birthdayMonth: 2,
      };
      vi.mocked(birthdayDao.getNextBirthday).mockResolvedValue(
        okResponse(next) as any
      );

      const result = await service.getNextBirthday();

      expect(result).toEqual(next);
      expect(birthdayDao.getNextBirthday).toHaveBeenCalledOnce();
    });

    it("returns an empty object (not throws) on a non-200 response", async () => {
      vi.mocked(birthdayDao.getNextBirthday).mockResolvedValue(
        errorResponse(404, "Error") as any
      );

      const result = await service.getNextBirthday();

      expect(result).toEqual({});
    });
  });
});

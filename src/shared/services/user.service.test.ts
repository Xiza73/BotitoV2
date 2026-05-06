import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/dao/user.dao");

import * as userDao from "../../api/dao/user.dao";
import * as service from "./user.service";

const okResponse = (data: unknown) => ({
  statusCode: 200,
  message: "ok",
  data,
});

const errorResponse = (statusCode: number, message: string) => ({
  statusCode,
  message,
});

describe("user.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserById", () => {
    it("returns the .data field on a 200 response", async () => {
      vi.mocked(userDao.readUserByDiscordId).mockResolvedValue(
        okResponse({ name: "Diego", discordId: "123" }) as any
      );

      const result = await service.getUserById("123");

      expect(result).toEqual({ name: "Diego", discordId: "123" });
      expect(userDao.readUserByDiscordId).toHaveBeenCalledWith("123");
    });

    it("throws an Error with the response message on a non-200 response", async () => {
      vi.mocked(userDao.readUserByDiscordId).mockResolvedValue(
        errorResponse(404, "Usuario no encontrado") as any
      );

      await expect(service.getUserById("999")).rejects.toThrow(
        "Usuario no encontrado"
      );
    });
  });

  describe("getUserByName", () => {
    it("returns the .data field on a 200 response", async () => {
      vi.mocked(userDao.readUserByName).mockResolvedValue(
        okResponse({ name: "Diego", discordId: "123" }) as any
      );

      const result = await service.getUserByName("Diego");

      expect(result).toEqual({ name: "Diego", discordId: "123" });
      expect(userDao.readUserByName).toHaveBeenCalledWith("Diego");
    });

    it("throws an Error with the response message on a non-200 response", async () => {
      vi.mocked(userDao.readUserByName).mockResolvedValue(
        errorResponse(400, "Error al recibir datos") as any
      );

      await expect(service.getUserByName("")).rejects.toThrow(
        "Error al recibir datos"
      );
    });
  });

  describe("getCurrentMessary", () => {
    it("returns the .data field on a 200 response", async () => {
      vi.mocked(userDao.getCurrentMessary).mockResolvedValue(
        okResponse(7) as any
      );

      const result = await service.getCurrentMessary("123");

      expect(result).toBe(7);
      expect(userDao.getCurrentMessary).toHaveBeenCalledWith("123");
    });

    it("returns 0 (not throws) on a non-200 response", async () => {
      vi.mocked(userDao.getCurrentMessary).mockResolvedValue(
        errorResponse(400, "Error") as any
      );

      const result = await service.getCurrentMessary("999");

      expect(result).toBe(0);
    });
  });

  describe("updateMonth", () => {
    it("returns the .data field on a 200 response", async () => {
      vi.mocked(userDao.updateMonth).mockResolvedValue(
        okResponse(undefined) as any
      );

      const result = await service.updateMonth("123", 8);

      expect(result).toBeUndefined();
      expect(userDao.updateMonth).toHaveBeenCalledWith("123", 8);
    });

    it("throws an Error with the response message on a non-200 response", async () => {
      vi.mocked(userDao.updateMonth).mockResolvedValue(
        errorResponse(422, "Datos insuficientes") as any
      );

      await expect(service.updateMonth("123", 0)).rejects.toThrow(
        "Datos insuficientes"
      );
    });
  });
});

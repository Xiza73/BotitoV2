import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/dao/user.dao");

import * as userDao from "../../api/dao/user.dao";
import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import register from "./register";

beforeEach(() => {
  vi.clearAllMocks();
});

const validArgs = [
  arg("name", "Diego"),
  arg("user", "user-1"),
  arg("day", 17),
  arg("month", 2),
];

describe("/register", () => {
  it("calls userDao.addUser with the parsed args and replies with a success embed", async () => {
    vi.mocked(userDao.addUser).mockResolvedValue({
      statusCode: 200,
      message: "Usuario agregado",
    } as any);

    const interaction = createMockInteraction();
    await register.run(createMockClient(), interaction, validArgs);

    expect(userDao.addUser).toHaveBeenCalledWith({
      name: "Diego",
      discordId: "user-1",
      birthdayDay: "17",
      birthdayMonth: "2",
    });
    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("✅ Miembro registrado");
    expect(embed.color).toBe(0xed4245); // mod red
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.author).toBeUndefined();
  });

  it("renders an error title when the DAO returns non-200", async () => {
    vi.mocked(userDao.addUser).mockResolvedValue({
      statusCode: 422,
      message: "Datos insuficientes",
    } as any);

    const interaction = createMockInteraction();
    await register.run(createMockClient(), interaction, validArgs);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("❌ Error al registrar");
    expect(embed.description).toContain("Datos insuficientes");
  });

  it("rejects ephemerally when the member lacks Administrator", async () => {
    const interaction = createMockInteraction({
      member: { permissions: { has: vi.fn().mockReturnValue(false) } },
    });

    await register.run(createMockClient(), interaction, validArgs);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(userDao.addUser).not.toHaveBeenCalled();
  });

  it("rejects ephemerally when day is out of range", async () => {
    const interaction = createMockInteraction();
    await register.run(createMockClient(), interaction, [
      arg("name", "Diego"),
      arg("user", "user-1"),
      arg("day", 99),
      arg("month", 2),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("día");
    expect(userDao.addUser).not.toHaveBeenCalled();
  });

  it("rejects ephemerally when month is out of range", async () => {
    const interaction = createMockInteraction();
    await register.run(createMockClient(), interaction, [
      arg("name", "Diego"),
      arg("user", "user-1"),
      arg("day", 17),
      arg("month", 13),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("mes");
    expect(userDao.addUser).not.toHaveBeenCalled();
  });

  it("becomes ephemeral when private:true is passed", async () => {
    vi.mocked(userDao.addUser).mockResolvedValue({
      statusCode: 200,
      message: "ok",
    } as any);

    const interaction = createMockInteraction();
    await register.run(createMockClient(), interaction, [
      ...validArgs,
      arg("private", true),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });
});

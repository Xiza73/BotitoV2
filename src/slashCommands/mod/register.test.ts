import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/dao/user.dao");

import * as userDao from "../../api/dao/user.dao";
import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import register from "./register";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/register", () => {
  it("calls userDao.addUser with the parsed args and replies with the result embed", async () => {
    vi.mocked(userDao.addUser).mockResolvedValue({
      statusCode: 200,
      message: "Usuario agregado",
    } as any);

    const interaction = createMockInteraction();
    await register.run(createMockClient(), interaction, [
      arg("name", "Diego"),
      arg("user", "user-1"),
      arg("day", 17),
      arg("month", 2),
    ]);

    expect(userDao.addUser).toHaveBeenCalledWith({
      name: "Diego",
      discordId: "user-1",
      birthdayDay: "17",
      birthdayMonth: "2",
    });
    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
  });

  it("rejects ephemerally when the member lacks Administrator", async () => {
    vi.mocked(userDao.addUser).mockResolvedValue({} as any);

    const interaction = createMockInteraction({
      member: { permissions: { has: vi.fn().mockReturnValue(false) } },
    });

    await register.run(createMockClient(), interaction, [
      arg("name", "Diego"),
      arg("user", "user-1"),
      arg("day", 17),
      arg("month", 2),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(userDao.addUser).not.toHaveBeenCalled();
  });
});

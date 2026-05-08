import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/services/user.service");

import * as userService from "../../shared/services/user.service";
import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import who from "./who";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/who", () => {
  const sampleUser = {
    name: "Diego",
    discordId: "111",
    birthdayDay: "17",
    birthdayMonth: "2",
  };

  it("looks up by user option when provided", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);

    const interaction = createMockInteraction();
    await who.run(createMockClient(), interaction, [arg("user", "111")]);

    expect(userService.getUserById).toHaveBeenCalledWith("111");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("looks up by name when only the name option is provided", async () => {
    vi.mocked(userService.getUserByName).mockResolvedValue(sampleUser);

    const interaction = createMockInteraction();
    await who.run(createMockClient(), interaction, [arg("name", "Diego")]);

    expect(userService.getUserByName).toHaveBeenCalledWith("Diego");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("falls back to the caller's discordId when neither option is provided", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);

    const interaction = createMockInteraction({ user: { id: "caller-1" } });
    await who.run(createMockClient(), interaction, []);

    expect(userService.getUserById).toHaveBeenCalledWith("caller-1");
  });

  it("renders the branded CUMpleaños embed with mod-red color and brand footer", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);

    const interaction = createMockInteraction();
    await who.run(createMockClient(), interaction, [arg("user", "111")]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("🎂 CUMpleaños");
    expect(embed.color).toBe(0xed4245); // mod red
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.author).toBeUndefined();
    const fechaField = embed.fields.find((f: any) => f.name === "📅 Fecha");
    expect(fechaField.value).toContain("17 de Febrero");
  });

  it("public by default, ephemeral when private:true", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(sampleUser);

    const i1 = createMockInteraction();
    await who.run(createMockClient(), i1, [arg("user", "111")]);
    expect(i1.reply.mock.calls[0][0].flags).toBeUndefined();

    const i2 = createMockInteraction();
    await who.run(createMockClient(), i2, [
      arg("user", "111"),
      arg("private", true),
    ]);
    expect(i2.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
  });
});

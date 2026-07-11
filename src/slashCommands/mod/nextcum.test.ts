import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/services/birthday.service");

import * as birthdayService from "../../shared/services/birthday.service";
import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import nextcum from "./nextcum";

beforeEach(() => {
  vi.clearAllMocks();
});

// One person in Febrero → single-entry, no nav buttons.
const oneBirthday = {
  Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
};

// Two people across months → nav buttons show.
const twoBirthdays = {
  Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
  Mayo: [{ name: "Ana", discordId: "222", birthdayDay: 5 }],
};

describe("/nextcum", () => {
  it("replies with the upcoming-birthday embed and no buttons for a single entry", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue(oneBirthday);

    const interaction = createMockInteraction();
    const client = createMockClient();
    await nextcum.run(client, interaction, []);

    expect(client.users.fetch).toHaveBeenCalledWith("111");
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(payload.components).toEqual([]); // no nav for a single entry
    expect(payload.allowedMentions).toEqual({ parse: [] });
  });

  it("shows nav buttons when there is more than one birthday", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue(twoBirthdays);

    const interaction = createMockInteraction();
    await nextcum.run(createMockClient(), interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.components).toHaveLength(1);
    expect(interaction.fetchReply).toHaveBeenCalled(); // collector attached
  });

  it("replies ephemerally when no birthday is registered", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue({});

    const interaction = createMockInteraction();
    await nextcum.run(createMockClient(), interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("No hay");
  });

  it("renders the canonical fields: real name, mention, fecha, faltan, position", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue(oneBirthday);

    const interaction = createMockInteraction();
    await nextcum.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("🎂 Próximo cumple");
    expect(embed.description).toContain("Diego");
    expect(embed.description).toContain("<@111>");
    expect(
      embed.fields.find((f: any) => f.name === "📅 Fecha").value
    ).toContain("17 de Febrero");
    expect(
      embed.fields.find((f: any) => f.name === "⏳ Faltan").value
    ).toMatch(/^<t:\d+:R>$/);
    expect(embed.footer.text).toMatch(/Xiza Bot v[\d.]+ · 1\/1/);
  });

  it("uses mod-red color and the brand footer (no setAuthor)", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue(oneBirthday);

    const interaction = createMockInteraction();
    await nextcum.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.color).toBe(0xed4245);
    expect(embed.author).toBeUndefined();
  });

  it("public by default, ephemeral when private:true", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue(oneBirthday);

    const i1 = createMockInteraction();
    await nextcum.run(createMockClient(), i1, []);
    expect(i1.reply.mock.calls[0][0].flags).toBeUndefined();

    const i2 = createMockInteraction();
    await nextcum.run(createMockClient(), i2, [arg("private", true)]);
    expect(i2.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
  });
});

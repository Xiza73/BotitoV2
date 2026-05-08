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

const sample = {
  name: "Diego",
  discordId: "111",
  birthdayDay: 17,
  birthdayMonth: 2,
};

describe("/nextcum", () => {
  it("fetches the user and replies with the upcoming-birthday embed", async () => {
    vi.mocked(birthdayService.getNextBirthday).mockResolvedValue(sample);

    const interaction = createMockInteraction();
    const client = createMockClient();
    await nextcum.run(client, interaction, []);

    expect(client.users.fetch).toHaveBeenCalledWith("111");
    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(payload.allowedMentions).toEqual({ parse: [] });
  });

  it("replies ephemerally when no birthday is registered", async () => {
    vi.mocked(birthdayService.getNextBirthday).mockResolvedValue({} as any);

    const interaction = createMockInteraction();
    await nextcum.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("renders the canonical fields: real name, mention, fecha, faltan", async () => {
    vi.mocked(birthdayService.getNextBirthday).mockResolvedValue(sample);

    const interaction = createMockInteraction();
    await nextcum.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("🎂 Próximo cumple");
    expect(embed.description).toContain("Diego");
    expect(embed.description).toContain("<@111>");

    const fechaField = embed.fields.find((f: any) => f.name === "📅 Fecha");
    expect(fechaField.value).toContain("17 de Febrero");

    const faltanField = embed.fields.find((f: any) => f.name === "⏳ Faltan");
    expect(faltanField.value).toMatch(/^<t:\d+:R>$/);
  });

  it("uses mod-red color and the brand footer (no setAuthor)", async () => {
    vi.mocked(birthdayService.getNextBirthday).mockResolvedValue(sample);

    const interaction = createMockInteraction();
    await nextcum.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.color).toBe(0xed4245);
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.author).toBeUndefined();
  });

  it("public by default, ephemeral when private:true", async () => {
    vi.mocked(birthdayService.getNextBirthday).mockResolvedValue(sample);

    const i1 = createMockInteraction();
    await nextcum.run(createMockClient(), i1, []);
    expect(i1.reply.mock.calls[0][0].flags).toBeUndefined();

    const i2 = createMockInteraction();
    await nextcum.run(createMockClient(), i2, [arg("private", true)]);
    expect(i2.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
  });
});

import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import love from "./love";

const findField = (embed: any, name: string) =>
  embed.data.fields.find((f: any) => f.name === name);

const runShip = async (
  user1: string,
  user2: string,
  extra: { name: string; value: any }[] = []
) => {
  const interaction = createMockInteraction();
  await love.run(createMockClient(), interaction, [
    arg("user1", user1),
    arg("user2", user2),
    ...extra.map((e) => arg(e.name, e.value)),
  ]);
  return interaction;
};

describe("/love", () => {
  it("replies with an embed and suppresses pings", async () => {
    const interaction = await runShip("111", "222");

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(payload.allowedMentions).toEqual({ users: [] });
    const embed = payload.embeds[0];
    expect(embed.data.description).toContain("<@111>");
    expect(embed.data.description).toContain("<@222>");
  });

  it("includes Compatibilidad and Veredicto fields with a heart bar and a percentage", async () => {
    const interaction = await runShip("111", "222");
    const embed = interaction.reply.mock.calls[0][0].embeds[0];

    const compat = findField(embed, "💯 Compatibilidad");
    expect(compat).toBeDefined();
    expect(compat.value).toMatch(/\d+%/);
    // Either the filled or empty heart should appear
    expect(compat.value).toMatch(/❤️|🤍/);

    const verdict = findField(embed, "💌 Veredicto");
    expect(verdict).toBeDefined();
    expect(typeof verdict.value).toBe("string");
    expect(verdict.value.length).toBeGreaterThan(0);
  });

  it("returns the same percentage for the same pair regardless of order", async () => {
    const ab = await runShip("user-a", "user-b");
    const ba = await runShip("user-b", "user-a");

    const pctAB = ab.reply.mock.calls[0][0].embeds[0].data.fields.find(
      (f: any) => f.name === "💯 Compatibilidad"
    ).value;
    const pctBA = ba.reply.mock.calls[0][0].embeds[0].data.fields.find(
      (f: any) => f.name === "💯 Compatibilidad"
    ).value;
    expect(pctAB).toBe(pctBA);
  });

  it("force-100% with the self-love phrase when shipping a user with themself", async () => {
    const interaction = await runShip("solo-user", "solo-user");
    const embed = interaction.reply.mock.calls[0][0].embeds[0];

    const compat = findField(embed, "💯 Compatibilidad");
    expect(compat.value).toContain("100%");

    const verdict = findField(embed, "💌 Veredicto");
    expect(verdict.value).toContain("amor propio");
    expect(embed.data.description).toContain("consigo mismo");
  });

  it("becomes ephemeral when private:true is passed", async () => {
    const interaction = await runShip("111", "222", [
      { name: "private", value: true },
    ]);
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("uses the fun-category color and the brand footer (no setAuthor)", async () => {
    const interaction = await runShip("111", "222");
    const embed = interaction.reply.mock.calls[0][0].embeds[0];
    expect(embed.data.color).toBe(0xfee75c);
    expect(embed.data.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.data.author).toBeUndefined();
  });
});

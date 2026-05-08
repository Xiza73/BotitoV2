import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import team from "./team";

describe("/team", () => {
  it("splits a list into N balanced teams (round-robin distribution)", async () => {
    const interaction = createMockInteraction();
    await team.run(createMockClient(), interaction, [
      arg("list", "ana bob carla diego eve frank"),
      arg("teams", 2),
    ]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("🧑‍🤝‍🧑 Equipos");
    expect(embed.color).toBe(0xfee75c);
    expect(embed.fields).toHaveLength(2);
    // 6 items / 2 teams = 3 each
    embed.fields.forEach((f: any) => {
      expect(f.name).toMatch(/^🏳️ Equipo \d+ \(3\)$/);
    });
  });

  it("balances unequal divisions (max diff of 1 between team sizes)", async () => {
    const interaction = createMockInteraction();
    await team.run(createMockClient(), interaction, [
      arg("list", "a b c d e"),
      arg("teams", 3),
    ]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    // 5 items / 3 teams → sizes 2, 2, 1 (or 2, 1, 2 depending on shuffle)
    const sizes = embed.fields.map((f: any) =>
      parseInt(f.name.match(/\((\d+)\)/)![1])
    );
    expect(sizes.reduce((a: number, b: number) => a + b, 0)).toBe(5);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("accepts comma-separated lists", async () => {
    const interaction = createMockInteraction();
    await team.run(createMockClient(), interaction, [
      arg("list", "ana,bob,carla,diego"),
      arg("teams", 2),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.fields).toHaveLength(2);
  });

  it("rejects ephemerally when teams is out of range", async () => {
    const interaction = createMockInteraction();
    await team.run(createMockClient(), interaction, [
      arg("list", "a b c d"),
      arg("teams", 99),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("entre 2 y 10");
  });

  it("rejects ephemerally when the list has fewer items than teams", async () => {
    const interaction = createMockInteraction();
    await team.run(createMockClient(), interaction, [
      arg("list", "ana bob"),
      arg("teams", 5),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("No hay suficientes");
  });

  it("rejects ephemerally when the list has fewer than 2 items", async () => {
    const interaction = createMockInteraction();
    await team.run(createMockClient(), interaction, [
      arg("list", "solo"),
      arg("teams", 2),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("al menos 2");
  });

  it("ephemeral when private:true", async () => {
    const interaction = createMockInteraction();
    await team.run(createMockClient(), interaction, [
      arg("list", "ana bob carla"),
      arg("teams", 2),
      arg("private", true),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });
});

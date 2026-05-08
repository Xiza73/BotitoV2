import { MessageFlags } from "discord.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import flip from "./flip";

const stubRandom = (value: number) =>
  vi.spyOn(Math, "random").mockReturnValue(value);

describe("/flip", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("flips a single coin by default and replies publicly", async () => {
    stubRandom(0.1); // < 0.5 → Cara
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(payload.flags).toBeUndefined(); // public default
    expect(payload.embeds[0].data.description).toContain("Cara");
  });

  it("renders Cruz when Math.random returns >= 0.5", async () => {
    stubRandom(0.9);
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds[0].data.description).toContain("Cruz");
    expect(payload.embeds[0].data.description).not.toContain("Cara");
  });

  it("flips N coins and adds a totals line when N > 1", async () => {
    stubRandom(0.1); // all heads
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, [arg("coins", 3)]);

    const payload = interaction.reply.mock.calls[0][0];
    const desc = payload.embeds[0].data.description;
    // 3 cara lines
    expect(desc.split("Cara").length - 1).toBe(3);
    expect(desc).toContain("**Total:**");
    expect(desc).toContain("3 caras");
    expect(desc).toContain("0 cruces");
  });

  it("clamps coins above 10 down to 10", async () => {
    stubRandom(0.1);
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, [arg("coins", 999)]);

    const payload = interaction.reply.mock.calls[0][0];
    const desc = payload.embeds[0].data.description;
    expect(desc.split("Cara").length - 1).toBe(10);
  });

  it("rejects ephemerally when coins < 1", async () => {
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, [arg("coins", 0)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("al menos 1");
  });

  it("becomes ephemeral when private:true is passed", async () => {
    stubRandom(0.1);
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, [arg("private", true)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("uses the fun-category color and the brand footer (no setAuthor)", async () => {
    stubRandom(0.1);
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0];
    expect(embed.data.color).toBe(0xfee75c); // fun yellow
    expect(embed.data.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.data.author).toBeUndefined();
  });

  it("singular Spanish: '1 cara · 0 cruces' (and inverse) for N === 2 with mixed result", async () => {
    // Two flips: first random ≥ 0.5 → Cruz, second < 0.5 → Cara
    const seq = [0.9, 0.1];
    let i = 0;
    vi.spyOn(Math, "random").mockImplementation(() => seq[i++]);

    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, [arg("coins", 2)]);

    const desc = interaction.reply.mock.calls[0][0].embeds[0].data.description;
    expect(desc).toContain("1 cara");
    expect(desc).toContain("1 cruz"); // singular for tails as well
  });
});

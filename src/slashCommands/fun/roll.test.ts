import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("jimp", () => ({
  Jimp: class {
    static read = vi.fn().mockResolvedValue({ width: 100, height: 100 });
    composite = vi.fn();
    getBuffer = vi.fn().mockResolvedValue(Buffer.from("fake-png"));
  },
}));

import { Jimp } from "jimp";
import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import roll from "./roll";

beforeEach(() => {
  (Jimp as any).read.mockClear();
});

describe("/roll", () => {
  it("composes a dice image when sides is in {4, 6, 12}", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [
      arg("quantity", 3),
      arg("sides", 6),
    ]);

    expect(Jimp.read).toHaveBeenCalledTimes(3);
    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.files).toBeDefined();
    expect(payload.files).toHaveLength(1);
    expect(payload.files![0].name).toBe("dice.png");
  });

  it("falls back to text output when sides is not in {4, 6, 12}", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [
      arg("quantity", 5),
      arg("sides", 20),
    ]);

    expect(Jimp.read).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(payload.files).toBeUndefined();
  });

  it("clamps quantity above 20 down to 20", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [
      arg("quantity", 999),
      arg("sides", 6),
    ]);

    expect(Jimp.read).toHaveBeenCalledTimes(20);
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("includes a Total line when quantity > 1", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [
      arg("quantity", 4),
      arg("sides", 20),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    const desc = payload.embeds[0].data.description;
    expect(desc).toContain("**4d20**");
    expect(desc).toContain("**Total:**");
  });

  it("uses singular phrasing for a single roll", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [arg("sides", 20)]);

    const payload = interaction.reply.mock.calls[0][0];
    const desc = payload.embeds[0].data.description;
    expect(desc).toContain("Sacaste un");
    expect(desc).toContain("d20");
    expect(desc).not.toContain("Total");
  });

  it("rejects ephemerally when quantity < 1", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [arg("quantity", 0)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("al menos 1");
    expect(Jimp.read).not.toHaveBeenCalled();
  });

  it("rejects ephemerally when sides < 2", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [arg("sides", 1)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("al menos 2");
  });

  it("becomes ephemeral when private:true is passed", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [
      arg("sides", 20),
      arg("private", true),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("uses the fun-category color and the brand footer (no setAuthor)", async () => {
    const interaction = createMockInteraction();
    await roll.run(createMockClient(), interaction, [arg("sides", 20)]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0];
    expect(embed.data.color).toBe(0xfee75c);
    expect(embed.data.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.data.author).toBeUndefined();
  });
});

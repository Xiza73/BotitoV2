import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("jimp", () => ({
  Jimp: class {
    static read = vi.fn().mockResolvedValue({ width: 100, height: 100 });
    composite = vi.fn();
    getBuffer = vi.fn().mockResolvedValue(Buffer.from("fake-png"));
  },
}));

import { Jimp } from "jimp";
import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
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
});

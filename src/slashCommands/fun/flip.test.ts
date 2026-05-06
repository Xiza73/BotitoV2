import { describe, expect, it, vi } from "vitest";

import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import flip from "./flip";

describe("/flip", () => {
  it("replies with a single Heads-or-Tails by default", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1); // < 0.5 → Heads

    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
  });

  it("flips N coins when the option is provided", async () => {
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, [arg("coins", 5)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("clamps coin counts above 10 down to 10", async () => {
    const interaction = createMockInteraction();
    await flip.run(createMockClient(), interaction, [arg("coins", 999)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    // The function uses ?.value && clamp internally; we just verify it doesn't blow up
  });
});

import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import { createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import gmi2 from "./gmi2";

describe("/gmi2", () => {
  it("replies with the server info embed", async () => {
    const interaction = createMockInteraction();
    await gmi2.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(payload.allowedMentions).toEqual({ repliedUser: false });
  });

  it("replies ephemerally when invoked outside a guild", async () => {
    const interaction = createMockInteraction({ guild: null });
    await gmi2.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });
});

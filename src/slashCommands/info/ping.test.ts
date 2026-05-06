import { describe, expect, it } from "vitest";

import { createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import ping from "./ping";

describe("/ping", () => {
  it("sends 'Pinging...' to the channel and replies with the ping embed", async () => {
    const interaction = createMockInteraction();
    await ping.run(createMockClient(), interaction, []);

    expect(interaction.channel.send).toHaveBeenCalledWith("🏓 Pinging...");
    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
  });

  it("returns early when the channel is not sendable", async () => {
    const interaction = createMockInteraction({
      channel: { isSendable: () => false },
    });
    await ping.run(createMockClient(), interaction, []);

    expect(interaction.reply).not.toHaveBeenCalled();
  });
});

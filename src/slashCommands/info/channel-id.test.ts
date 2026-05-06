import { describe, expect, it } from "vitest";

import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import channelId from "./channel-id";

describe("/channel-id", () => {
  it("returns the current channel id when no option is provided", async () => {
    const interaction = createMockInteraction({ channelId: "current-ch" });
    await channelId.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.content).toContain("<#current-ch>");
    expect(payload.content).toContain("current-ch");
  });

  it("returns the provided channel id when the option is set", async () => {
    const interaction = createMockInteraction();
    await channelId.run(createMockClient(), interaction, [
      arg("channel", "specific-ch"),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.content).toContain("<#specific-ch>");
  });
});

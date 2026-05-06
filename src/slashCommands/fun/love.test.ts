import { describe, expect, it } from "vitest";

import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import love from "./love";

describe("/love", () => {
  it("replies with the cheesy ship line and suppresses pings", async () => {
    const interaction = createMockInteraction();
    await love.run(createMockClient(), interaction, [
      arg("user1", "111"),
      arg("user2", "222"),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.content).toContain("<@111>");
    expect(payload.content).toContain("<@222>");
    expect(payload.allowedMentions).toEqual({ users: [] });
  });
});

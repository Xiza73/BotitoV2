import { MessageFlags, PermissionFlagsBits } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import say from "./say";

describe("/say", () => {
  it("relays the message as a plain channel send when as_embed is unset, then confirms ephemerally", async () => {
    const interaction = createMockInteraction();
    await say.run(createMockClient(), interaction, [
      arg("message", "hola mundo"),
    ]);

    expect(interaction.channel.send).toHaveBeenCalledWith("hola mundo");
    expect(interaction.reply).toHaveBeenCalledWith({
      content: "✅ Mensaje enviado.",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("sends the channel message BEFORE the ephemeral reply (so reply can carry an error if send fails)", async () => {
    const callOrder: string[] = [];
    const interaction = createMockInteraction();
    interaction.channel.send.mockImplementation(async () => {
      callOrder.push("send");
      return { id: "msg" };
    });
    interaction.reply.mockImplementation(async () => {
      callOrder.push("reply");
      return { id: "reply" };
    });

    await say.run(createMockClient(), interaction, [arg("message", "hola")]);

    expect(callOrder).toEqual(["send", "reply"]);
  });

  it("sends a white-colored embed when as_embed is true (no brand footer — it's a moderator amplification, not a bot announcement)", async () => {
    const interaction = createMockInteraction();
    await say.run(createMockClient(), interaction, [
      arg("message", "hola"),
      arg("as_embed", true),
    ]);

    expect(interaction.channel.send).toHaveBeenCalledOnce();
    const payload = (interaction.channel.send as any).mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    const embed = payload.embeds[0].data;
    expect(embed.description).toBe("hola");
    expect(embed.footer).toBeUndefined();
    expect(embed.author).toBeUndefined();
  });

  it("rejects with an ephemeral notice when the member lacks ManageMessages", async () => {
    const interaction = createMockInteraction({
      member: { permissions: { has: vi.fn().mockReturnValue(false) } },
    });

    await say.run(createMockClient(), interaction, [arg("message", "hola")]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(interaction.channel.send).not.toHaveBeenCalled();
  });

  it("checks for ManageMessages specifically", async () => {
    const has = vi.fn().mockReturnValue(true);
    const interaction = createMockInteraction({
      member: { permissions: { has } },
    });

    await say.run(createMockClient(), interaction, [arg("message", "hola")]);

    expect(has).toHaveBeenCalledWith(PermissionFlagsBits.ManageMessages);
  });
});

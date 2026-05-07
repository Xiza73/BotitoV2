import { MessageFlags, PermissionFlagsBits } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import say from "./say";

describe("/say", () => {
  it("relays the message as a plain channel send when as_embed is unset", async () => {
    const interaction = createMockInteraction();
    await say.run(createMockClient(), interaction, [arg("message", "hola mundo")]);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: "Listo.",
      flags: MessageFlags.Ephemeral,
    });
    expect(interaction.channel.send).toHaveBeenCalledWith("hola mundo");
  });

  it("sends an embed when as_embed is true", async () => {
    const interaction = createMockInteraction();
    await say.run(createMockClient(), interaction, [
      arg("message", "hola"),
      arg("as_embed", true),
    ]);

    expect(interaction.channel.send).toHaveBeenCalledOnce();
    const payload = (interaction.channel.send as any).mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
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

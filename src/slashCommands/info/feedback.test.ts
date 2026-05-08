import { MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import feedback from "./feedback";

const setupClientWithOwner = () => {
  const dmSend = vi.fn().mockResolvedValue({ id: "dm-msg" });
  const ownerCreateDM = vi.fn().mockResolvedValue({ send: dmSend });
  const client = createMockClient({
    config: { ownerId: "owner-1" },
    users: {
      fetch: vi
        .fn()
        .mockResolvedValue({ id: "owner-1", createDM: ownerCreateDM }),
    },
  });
  return { client, dmSend, ownerCreateDM };
};

describe("/feedback", () => {
  it("DMs the owner with a branded embed and confirms ephemerally", async () => {
    const { client, dmSend } = setupClientWithOwner();
    const interaction = createMockInteraction({
      user: {
        id: "alice",
        username: "alice",
        tag: "alice#0001",
        displayAvatarURL: () => "https://example.com/a.png",
      },
    });

    await feedback.run(client, interaction, [
      arg("message", "el bot está bárbaro"),
    ]);

    expect(dmSend).toHaveBeenCalledOnce();
    const dmPayload = dmSend.mock.calls[0][0];
    const embed = dmPayload.embeds[0].data;
    expect(embed.title).toBe("📨 Feedback recibido");
    expect(embed.description).toBe("el bot está bárbaro");
    expect(embed.color).toBe(0x5865f2);

    const fromField = embed.fields.find((f: any) => f.name === "👤 De");
    expect(fromField.value).toContain("<@alice>");

    const replyPayload = interaction.reply.mock.calls[0][0];
    expect(replyPayload.flags).toBe(MessageFlags.Ephemeral);
    expect(replyPayload.content).toContain("gracias");
  });

  it("hides the author when anonymous:true is passed", async () => {
    const { client, dmSend } = setupClientWithOwner();
    const interaction = createMockInteraction({
      user: {
        id: "alice",
        username: "alice",
        tag: "alice#0001",
        displayAvatarURL: () => "https://example.com/a.png",
      },
    });

    await feedback.run(client, interaction, [
      arg("message", "queja anónima"),
      arg("anonymous", true),
    ]);

    const embed = dmSend.mock.calls[0][0].embeds[0].data;
    const fromField = embed.fields.find((f: any) => f.name === "👤 De");
    expect(fromField.value).toContain("anónimo");
    expect(fromField.value).not.toContain("alice");
  });

  it("rejects ephemerally on empty message", async () => {
    const { client } = setupClientWithOwner();
    const interaction = createMockInteraction();
    await feedback.run(client, interaction, [arg("message", "   ")]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("vacío");
  });

  it("returns a friendly error if the owner DM can't be delivered", async () => {
    const ownerCreateDM = vi.fn().mockRejectedValue(new Error("blocked"));
    const client = createMockClient({
      config: { ownerId: "owner-1" },
      users: {
        fetch: vi
          .fn()
          .mockResolvedValue({ id: "owner-1", createDM: ownerCreateDM }),
      },
    });
    const interaction = createMockInteraction();

    await feedback.run(client, interaction, [arg("message", "hola")]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("No pude entregar");
  });
});

import { ChannelType, MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import channelId from "./channel-id";

describe("/channel-id", () => {
  it("uses the current channel id when no option is provided", async () => {
    const client = createMockClient();
    const interaction = createMockInteraction({ channelId: "current-ch" });

    await channelId.run(client, interaction, []);

    expect(client.channels.fetch).toHaveBeenCalledWith("current-ch");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("fetches the provided channel id when the option is set", async () => {
    const client = createMockClient();
    const interaction = createMockInteraction();

    await channelId.run(client, interaction, [arg("channel", "specific-ch")]);

    expect(client.channels.fetch).toHaveBeenCalledWith("specific-ch");
  });

  it("is ephemeral by default and public when public:true is passed", async () => {
    const interaction1 = createMockInteraction();
    await channelId.run(createMockClient(), interaction1, []);
    const ephemeralPayload = interaction1.reply.mock.calls[0][0];
    expect(ephemeralPayload.flags).toBe(MessageFlags.Ephemeral);

    const interaction2 = createMockInteraction();
    await channelId.run(createMockClient(), interaction2, [arg("public", true)]);
    const publicPayload = interaction2.reply.mock.calls[0][0];
    expect(publicPayload.flags).toBeUndefined();
  });

  it("includes the core metadata fields in the embed", async () => {
    const interaction = createMockInteraction({ channelId: "ch-42" });
    await channelId.run(createMockClient(), interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    const fieldNames = payload.embeds[0].data.fields.map((f: any) => f.name);

    expect(fieldNames).toContain("📁 Canal");
    expect(fieldNames).toContain("🆔 ID");
    expect(fieldNames).toContain("🏷 Tipo");
  });

  it("wraps the id in backticks for tap-to-copy", async () => {
    const interaction = createMockInteraction({ channelId: "ch-99" });
    await channelId.run(createMockClient(), interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    const idField = payload.embeds[0].data.fields.find(
      (f: any) => f.name === "🆔 ID"
    );
    expect(idField.value).toBe("`ch-99`");
  });

  it("includes the parent category field when the channel has one", async () => {
    const client = createMockClient();
    vi.mocked(client.channels.fetch).mockResolvedValueOnce({
      id: "ch-with-parent",
      name: "general",
      type: ChannelType.GuildText,
      guild: { id: "g", name: "G" },
      parent: { name: "Charla" },
      nsfw: false,
    } as any);

    const interaction = createMockInteraction();
    await channelId.run(client, interaction, [arg("channel", "ch-with-parent")]);

    const payload = interaction.reply.mock.calls[0][0];
    const fieldNames = payload.embeds[0].data.fields.map((f: any) => f.name);
    expect(fieldNames).toContain("📂 Categoría");
    const parentField = payload.embeds[0].data.fields.find(
      (f: any) => f.name === "📂 Categoría"
    );
    expect(parentField.value).toBe("Charla");
  });

  it("only adds the NSFW field when the channel is flagged NSFW", async () => {
    const client = createMockClient();
    vi.mocked(client.channels.fetch).mockResolvedValueOnce({
      id: "spicy",
      name: "spicy",
      type: ChannelType.GuildText,
      guild: { id: "g", name: "G" },
      parent: null,
      nsfw: true,
    } as any);

    const interaction = createMockInteraction();
    await channelId.run(client, interaction, [arg("channel", "spicy")]);

    const payload = interaction.reply.mock.calls[0][0];
    const fieldNames = payload.embeds[0].data.fields.map((f: any) => f.name);
    expect(fieldNames).toContain("🔞 NSFW");
  });

  it("formats common channel types with friendly labels", async () => {
    const client = createMockClient();
    vi.mocked(client.channels.fetch).mockResolvedValueOnce({
      id: "v",
      type: ChannelType.GuildVoice,
      guild: { id: "g" },
      parent: null,
      nsfw: false,
    } as any);

    const interaction = createMockInteraction();
    await channelId.run(client, interaction, [arg("channel", "v")]);

    const payload = interaction.reply.mock.calls[0][0];
    const typeField = payload.embeds[0].data.fields.find(
      (f: any) => f.name === "🏷 Tipo"
    );
    expect(typeField.value).toContain("Voz");
  });

  it("returns an ephemeral notice when the channel can't be fetched and there's no fallback", async () => {
    const client = createMockClient();
    vi.mocked(client.channels.fetch).mockRejectedValueOnce(new Error("404"));

    const interaction = createMockInteraction({
      channelId: "ghost",
      channel: null,
    });

    await channelId.run(client, interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.content).toContain("ghost");
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });
});

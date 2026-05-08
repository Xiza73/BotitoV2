import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import ping from "./ping";

describe("/ping", () => {
  it("defers publicly by default and replies via editReply with the embed", async () => {
    const interaction = createMockInteraction();
    await ping.run(createMockClient(), interaction, []);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    const deferPayload = interaction.deferReply.mock.calls[0][0];
    // Public default → no Ephemeral flag set
    expect(deferPayload?.flags).toBeUndefined();

    expect(interaction.editReply).toHaveBeenCalledOnce();
    const payload = interaction.editReply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(interaction.reply).not.toHaveBeenCalled();
    expect(interaction.channel.send).not.toHaveBeenCalled();
  });

  it("defers ephemerally when private:true is passed", async () => {
    const interaction = createMockInteraction();
    await ping.run(createMockClient(), interaction, [arg("private", true)]);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    const deferPayload = interaction.deferReply.mock.calls[0][0];
    expect(deferPayload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("includes the four expected metric fields in the embed", async () => {
    const interaction = createMockInteraction();
    await ping.run(createMockClient(), interaction, []);

    const payload = interaction.editReply.mock.calls[0][0];
    const fieldNames = payload.embeds[0].data.fields.map((f: any) => f.name);

    expect(fieldNames).toContain("📶 Round-trip");
    expect(fieldNames).toContain("📡 API");
    expect(fieldNames).toContain("⏰ Uptime");
    expect(fieldNames).toContain("📦 Versión");
  });

  it("reports the API ping from client.ws.ping", async () => {
    const client = createMockClient({ ws: { ping: 123 } });
    const interaction = createMockInteraction();
    await ping.run(client, interaction, []);

    const payload = interaction.editReply.mock.calls[0][0];
    const apiField = payload.embeds[0].data.fields.find(
      (f: any) => f.name === "📡 API"
    );
    expect(apiField.value).toContain("123ms");
  });

  it("clamps a negative ws.ping to 0 (happens when the bot just connected)", async () => {
    const client = createMockClient({ ws: { ping: -1 } });
    const interaction = createMockInteraction();
    await ping.run(client, interaction, []);

    const payload = interaction.editReply.mock.calls[0][0];
    const apiField = payload.embeds[0].data.fields.find(
      (f: any) => f.name === "📡 API"
    );
    expect(apiField.value).toContain("0ms");
  });
});

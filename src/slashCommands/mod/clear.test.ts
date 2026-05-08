import { Collection, MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import clear from "./clear";

const fakeMessage = (overrides: Partial<any> = {}) =>
  ({
    content: "hola",
    author: { username: "tester" },
    createdTimestamp: Date.now(),
    attachments: new Collection<string, any>(),
    ...overrides,
  }) as any;

const fakeBulkDeleteResult = (messages: any[]) => {
  const col = new Collection<string, any>();
  messages.forEach((m, i) => col.set(`msg-${i}`, m));
  return col;
};

describe("/clear", () => {
  it("replies ephemerally with a recap embed listing each deleted message, then posts a public auto-deleting count notice", async () => {
    vi.useFakeTimers();
    const noticeDelete = vi.fn().mockResolvedValue(undefined);
    const send = vi.fn().mockResolvedValue({ delete: noticeDelete });
    const messages = [
      fakeMessage({ content: "hola", author: { username: "ana" } }),
      fakeMessage({ content: "qué onda", author: { username: "bob" } }),
      fakeMessage({ content: "te leí", author: { username: "ana" } }),
      fakeMessage({ content: "🥲", author: { username: "carla" } }),
    ];
    const bulkDelete = vi
      .fn()
      .mockResolvedValue(fakeBulkDeleteResult(messages));
    const interaction = createMockInteraction({
      channel: { isSendable: () => true, send, bulkDelete },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    expect(bulkDelete).toHaveBeenCalledWith(4, true);

    // Ephemeral recap reply to the moderator
    const replyPayload = interaction.reply.mock.calls[0][0];
    expect(replyPayload.flags).toBe(MessageFlags.Ephemeral);
    expect(replyPayload.allowedMentions).toEqual({ parse: [] });
    const recap = replyPayload.embeds[0].data;
    expect(recap.title).toBe("📋 Eliminados (4)");
    expect(recap.description).toContain("ana");
    expect(recap.description).toContain("bob");
    expect(recap.description).toContain("carla");

    // Public count notice posted to the channel
    expect(send).toHaveBeenCalledOnce();
    const sentEmbed = send.mock.calls[0][0].embeds[0].data;
    expect(sentEmbed.title).toBe("🧹 Chat limpiado");
    expect(sentEmbed.color).toBe(0xed4245); // mod red
    expect(sentEmbed.footer.text).toMatch(/Xiza Bot v\d+/);

    // After 5s the public notice deletes itself
    await vi.advanceTimersByTimeAsync(5_000);
    expect(noticeDelete).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("public count notice uses singular phrasing for a 1-message delete", async () => {
    const send = vi.fn().mockResolvedValue({ delete: vi.fn() });
    const bulkDelete = vi
      .fn()
      .mockResolvedValue(fakeBulkDeleteResult([fakeMessage()]));
    const interaction = createMockInteraction({
      channel: { isSendable: () => true, send, bulkDelete },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 1)]);

    const description = send.mock.calls[0][0].embeds[0].data.description;
    expect(description).toMatch(/\*\*1\*\*\s+mensaje\.$/);
  });

  it("re-uploads image attachments as files (not URLs) so the recap survives the source delete", async () => {
    const fakeAttachment = {
      url: "https://cdn.discordapp.com/example.png",
      name: "example.png",
    };
    const att = new Collection<string, any>([["att-1", fakeAttachment]]);
    const send = vi.fn().mockResolvedValue({ delete: vi.fn() });
    const bulkDelete = vi.fn().mockResolvedValue(
      fakeBulkDeleteResult([
        fakeMessage({ content: "look at this", attachments: att }),
      ])
    );
    const interaction = createMockInteraction({
      channel: { isSendable: () => true, send, bulkDelete },
    });

    // Mock global fetch to return a tiny buffer
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
      })
    );

    await clear.run(createMockClient(), interaction, [arg("amount", 1)]);

    const replyPayload = interaction.reply.mock.calls[0][0];
    expect(replyPayload.files).toHaveLength(1);
    expect(replyPayload.files[0].name).toBe("example.png");
    expect(Buffer.isBuffer(replyPayload.files[0].attachment)).toBe(true);

    vi.unstubAllGlobals();
  });

  it("falls back to a friendly empty embed when bulkDelete returns 0 messages", async () => {
    const send = vi.fn().mockResolvedValue({ delete: vi.fn() });
    const bulkDelete = vi.fn().mockResolvedValue(fakeBulkDeleteResult([]));
    const interaction = createMockInteraction({
      channel: { isSendable: () => true, send, bulkDelete },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.embeds[0].data.title).toBe("🧹 Nada para limpiar");
    // No public notice when nothing got deleted
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects ephemerally when the member lacks ManageMessages", async () => {
    const interaction = createMockInteraction({
      member: { permissions: { has: vi.fn().mockReturnValue(false) } },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("permisos");
  });

  it("rejects ephemerally when amount is zero or negative", async () => {
    const interaction = createMockInteraction();
    await clear.run(createMockClient(), interaction, [arg("amount", 0)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("mayor a 0");
  });

  it("replies with an error embed when bulkDelete throws (eg. messages too old)", async () => {
    const bulkDelete = vi
      .fn()
      .mockRejectedValue(new Error("You can only bulk delete messages younger than 14 days"));
    const interaction = createMockInteraction({
      channel: { isSendable: () => true, send: vi.fn(), bulkDelete },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.embeds[0].data.title).toBe("❌ No se pudo limpiar el chat");
    expect(payload.embeds[0].data.description).toContain("14 days");
  });
});

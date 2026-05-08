import { Collection, MessageFlags } from "discord.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import clear from "./clear";

const fakeMessage = (overrides: Partial<any> = {}) => {
  const id = overrides.id ?? `msg-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    content: "hola",
    author: { username: "tester" },
    createdTimestamp: Date.now(),
    attachments: new Collection<string, any>(),
    ...overrides,
  } as any;
};

const fakeFetchResult = (messages: any[]) => {
  // Discord returns newest-first; test fixtures pass them oldest-first for
  // readability, so reverse to mimic real API order.
  const col = new Collection<string, any>();
  [...messages].reverse().forEach((m) => col.set(m.id, m));
  return col;
};

const fakeBulkResult = (messages: any[]) => {
  const col = new Collection<string, any>();
  messages.forEach((m) => col.set(m.id, m));
  return col;
};

const setupChannel = (messages: any[], opts: { send?: any } = {}) => {
  const send = opts.send ?? vi.fn().mockResolvedValue({ delete: vi.fn() });
  const fetch = vi.fn().mockResolvedValue(fakeFetchResult(messages));
  const bulkDelete = vi.fn().mockResolvedValue(fakeBulkResult(messages));
  return {
    channel: {
      isSendable: () => true,
      send,
      messages: { fetch },
      bulkDelete,
    },
    send,
    fetch,
    bulkDelete,
  };
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("/clear", () => {
  it("defers, downloads attachments BEFORE bulkDelete, then DMs the recap and posts the public count", async () => {
    vi.useFakeTimers();
    const messages = [
      fakeMessage({
        id: "m1",
        content: "hola",
        author: { username: "ana" },
      }),
      fakeMessage({
        id: "m2",
        content: "qué onda",
        author: { username: "bob" },
      }),
      fakeMessage({
        id: "m3",
        content: "🥲",
        author: { username: "carla" },
      }),
    ];
    const { channel, send, fetch, bulkDelete } = setupChannel(messages);

    const dmSend = vi.fn().mockResolvedValue({ id: "dm-msg" });
    const interaction = createMockInteraction({
      channel,
      user: {
        id: "mod-1",
        createDM: vi.fn().mockResolvedValue({ send: dmSend }),
      },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 3)]);

    // 1. Defers immediately so we don't hit the 3s 'Unknown interaction' timeout
    expect(interaction.deferReply).toHaveBeenCalledOnce();

    // 2. Fetches messages BEFORE deleting (so CDN URLs are still valid)
    expect(fetch).toHaveBeenCalledWith({ limit: 3 });

    // 3. bulkDelete is called by ID array, in chronological order
    const deleteCall = bulkDelete.mock.calls[0];
    expect(deleteCall[0]).toEqual(["m1", "m2", "m3"]);
    expect(deleteCall[1]).toBe(true);

    // 4. Recap delivered via DM (with all 3 messages)
    expect(dmSend).toHaveBeenCalledOnce();
    const dmPayload = dmSend.mock.calls[0][0];
    const recap = dmPayload.embeds[0].data;
    expect(recap.title).toBe("📋 Eliminados (3)");
    expect(recap.description).toContain("ana");
    expect(recap.description).toContain("bob");
    expect(recap.description).toContain("carla");
    expect(dmPayload.allowedMentions).toEqual({ parse: [] });

    // 5. Public count notice posted in channel
    expect(send).toHaveBeenCalledOnce();
    const noticeEmbed = send.mock.calls[0][0].embeds[0].data;
    expect(noticeEmbed.title).toBe("🧹 Chat limpiado");
    expect(noticeEmbed.description).toContain("3");

    // 6. Happy-path: deleteReply removes the deferred ephemeral
    expect(interaction.deleteReply).toHaveBeenCalledOnce();
    // No editReply — the deferred reply was simply deleted, not filled
    expect(interaction.editReply).not.toHaveBeenCalled();
  });

  it("skips the DM recap entirely for /clear amount:1 with a text-only message (the messageDelete listener already covers it)", async () => {
    const messages = [
      fakeMessage({ id: "m1", content: "asf", author: { username: "ana" } }),
    ];
    const { channel } = setupChannel(messages);

    const dmSend = vi.fn().mockResolvedValue({ id: "dm-msg" });
    const createDM = vi.fn().mockResolvedValue({ send: dmSend });
    const interaction = createMockInteraction({
      channel,
      user: { id: "mod-1", createDM },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 1)]);

    // No DM at all — the listener already handles single text deletes
    expect(createDM).not.toHaveBeenCalled();
    expect(dmSend).not.toHaveBeenCalled();

    // Public count notice still posts
    expect(channel.send).toHaveBeenCalledOnce();
    // Deferred ephemeral cleared
    expect(interaction.deleteReply).toHaveBeenCalledOnce();
  });

  it("DOES DM the recap for /clear amount:1 when the single message has an attachment", async () => {
    const att = new Collection<string, any>([
      ["a1", { url: "https://cdn.discordapp.com/x.png", name: "x.png" }],
    ]);
    const messages = [
      fakeMessage({ id: "m1", content: "look", attachments: att }),
    ];
    const { channel } = setupChannel(messages);
    const dmSend = vi.fn().mockResolvedValue({ id: "dm-msg" });
    const interaction = createMockInteraction({
      channel,
      user: {
        id: "mod-1",
        createDM: vi.fn().mockResolvedValue({ send: dmSend }),
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
      })
    );

    await clear.run(createMockClient(), interaction, [arg("amount", 1)]);

    // DM with the recap and the re-uploaded file
    expect(dmSend).toHaveBeenCalledOnce();
    const dmPayload = dmSend.mock.calls[0][0];
    expect(dmPayload.files).toHaveLength(1);
    expect(dmPayload.embeds[0].data.title).toBe("📋 Eliminados (1)");
    expect(dmPayload.embeds[0].data.description).toContain("look");
  });

  it("downloads attachments via fetch BEFORE bulkDelete and re-uploads them as files in the DM", async () => {
    const att = new Collection<string, any>([
      [
        "a1",
        {
          url: "https://cdn.discordapp.com/example.png",
          name: "example.png",
        },
      ],
    ]);
    const messages = [
      fakeMessage({
        id: "m1",
        content: "look",
        attachments: att,
      }),
    ];
    const { channel, bulkDelete } = setupChannel(messages);

    const dmSend = vi.fn().mockResolvedValue({ id: "dm-msg" });
    const interaction = createMockInteraction({
      channel,
      user: {
        id: "mod-1",
        createDM: vi.fn().mockResolvedValue({ send: dmSend }),
      },
    });

    // Track call order: fetch must complete before bulkDelete is called.
    const callOrder: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        callOrder.push("attachment-fetch");
        return {
          ok: true,
          arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
        };
      })
    );
    bulkDelete.mockImplementation(async (ids: any) => {
      callOrder.push("bulk-delete");
      return fakeBulkResult(messages);
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 1)]);

    expect(callOrder).toEqual(["attachment-fetch", "bulk-delete"]);

    const dmPayload = dmSend.mock.calls[0][0];
    expect(dmPayload.files).toHaveLength(1);
    expect(dmPayload.files[0].name).toBe("example.png");
    expect(Buffer.isBuffer(dmPayload.files[0].attachment)).toBe(true);
  });

  it("falls back to inline ephemeral when DMs are disabled (multi-message path so DM is actually attempted)", async () => {
    const messages = [
      fakeMessage({ id: "m1", content: "uno" }),
      fakeMessage({ id: "m2", content: "dos" }),
    ];
    const { channel } = setupChannel(messages);

    const interaction = createMockInteraction({
      channel,
      user: {
        id: "mod-1",
        createDM: vi.fn().mockRejectedValue(new Error("DMs blocked")),
      },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 2)]);

    // The deferReply gets edited (not deleted) so the moderator still sees the recap
    expect(interaction.deleteReply).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledOnce();
    const payload = interaction.editReply.mock.calls[0][0];
    expect(payload.content).toContain("DM");
    expect(payload.embeds[0].data.title).toBe("📋 Eliminados (2)");
  });

  it("rejects ephemerally when the member lacks ManageMessages (no defer needed — fast path)", async () => {
    const interaction = createMockInteraction({
      member: { permissions: { has: vi.fn().mockReturnValue(false) } },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("permisos");
    expect(interaction.deferReply).not.toHaveBeenCalled();
  });

  it("rejects ephemerally when amount <= 0", async () => {
    const interaction = createMockInteraction();
    await clear.run(createMockClient(), interaction, [arg("amount", 0)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("mayor a 0");
    expect(interaction.deferReply).not.toHaveBeenCalled();
  });

  it("editReplies a friendly empty embed when bulkDelete returns 0 messages (e.g. all >14d)", async () => {
    const messages = [fakeMessage({ id: "m1" })];
    const channel = {
      isSendable: () => true,
      send: vi.fn().mockResolvedValue({ delete: vi.fn() }),
      messages: { fetch: vi.fn().mockResolvedValue(fakeFetchResult(messages)) },
      bulkDelete: vi.fn().mockResolvedValue(fakeBulkResult([])), // 0 deleted
    };
    const interaction = createMockInteraction({
      channel,
      user: {
        id: "mod-1",
        createDM: vi.fn().mockResolvedValue({ send: vi.fn() }),
      },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    expect(interaction.editReply).toHaveBeenCalledOnce();
    const payload = interaction.editReply.mock.calls[0][0];
    expect(payload.embeds[0].data.title).toBe("🧹 Nada para limpiar");
    // Public notice not sent — nothing actually happened
    expect(channel.send).not.toHaveBeenCalled();
  });

  it("editReplies an error embed when bulkDelete throws", async () => {
    const messages = [fakeMessage({ id: "m1" })];
    const channel = {
      isSendable: () => true,
      send: vi.fn().mockResolvedValue({ delete: vi.fn() }),
      messages: { fetch: vi.fn().mockResolvedValue(fakeFetchResult(messages)) },
      bulkDelete: vi
        .fn()
        .mockRejectedValue(
          new Error("You can only bulk delete messages younger than 14 days")
        ),
    };
    const interaction = createMockInteraction({
      channel,
      user: {
        id: "mod-1",
        createDM: vi.fn().mockResolvedValue({ send: vi.fn() }),
      },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    expect(interaction.editReply).toHaveBeenCalledOnce();
    const payload = interaction.editReply.mock.calls[0][0];
    expect(payload.embeds[0].data.title).toBe("❌ No se pudo limpiar el chat");
    expect(payload.embeds[0].data.description).toContain("14 days");
  });
});

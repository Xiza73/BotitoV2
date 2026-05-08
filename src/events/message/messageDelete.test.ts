import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config", () => ({
  default: {
    gmi2Channel: "gmi2",
    ownerId: "owner",
  },
}));

import { createMockClient } from "../../test-utils/discord-mocks";
import messageDelete from "./messageDelete";

const createMessage = (overrides: Record<string, any> = {}) => ({
  author: {
    bot: false,
    username: "Diego",
    tag: "diego#0001",
    displayAvatarURL: () => "https://example.com/diego.png",
  },
  content: "hola",
  attachments: { at: () => undefined },
  channel: { id: "gmi2" },
  ...overrides,
});

const ownerMock = (overrides: Record<string, any> = {}) => {
  const send = vi.fn().mockResolvedValue(undefined);
  return {
    client: createMockClient({
      users: {
        fetch: vi.fn().mockResolvedValue({ send, ...overrides }),
      },
    }),
    send,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("messageDelete", () => {
  it("ignores messages from bot authors", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({
      author: { bot: true, username: "BotUser", tag: "bot#0001" },
    });

    await messageDelete.execute(message as any, client);

    expect(send).not.toHaveBeenCalled();
  });

  it("ignores messages with no content and no attachment", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({
      content: "",
      attachments: { at: () => undefined },
    });

    await messageDelete.execute(message as any, client);

    expect(send).not.toHaveBeenCalled();
  });

  it("ignores messages outside the gmi2 channel", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({ channel: { id: "other" } });

    await messageDelete.execute(message as any, client);

    expect(send).not.toHaveBeenCalled();
  });

  it("DMs the owner with a branded embed for a regular text message", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({ content: "test message" });

    await messageDelete.execute(message as any, client);

    expect(send).toHaveBeenCalledOnce();
    const payload = send.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    const embed = payload.embeds[0].data;
    expect(embed.title).toBeUndefined();
    expect(embed.description).toBe("test message");
    expect(embed.color).toBe(0xed4245); // mod red
    expect(embed.author.name).toBe("Diego");
    expect(embed.footer.text).toMatch(/🗑️ Eliminado · Xiza Bot v\d+/);
  });

  it("DMs the owner with the file attached AND the same branded embed when the deleted message had an image", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({
      content: "look at this",
      attachments: { at: () => ({ url: "https://example.com/img.png" }) },
    });

    await messageDelete.execute(message as any, client);

    expect(send).toHaveBeenCalledOnce();
    const payload = send.mock.calls[0][0];
    // Re-uploads the URL as a fresh file so it survives the source delete
    expect(payload.files).toEqual(["https://example.com/img.png"]);
    // Embed shape consistent with the text-only case
    const embed = payload.embeds[0].data;
    expect(embed.title).toBeUndefined();
    expect(embed.description).toBe("look at this");
    expect(embed.color).toBe(0xed4245);
  });

  it("when the deleted message had ONLY an image (no text), the embed has no description", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({
      content: "",
      attachments: { at: () => ({ url: "https://example.com/img.png" }) },
    });

    await messageDelete.execute(message as any, client);

    const payload = send.mock.calls[0][0];
    expect(payload.files).toEqual(["https://example.com/img.png"]);
    expect(payload.embeds[0].data.description).toBeUndefined();
  });

  it("truncates very long messages to fit the embed description budget", async () => {
    const { client, send } = ownerMock();
    const longContent = "x".repeat(5000);
    const message = createMessage({ content: longContent });

    await messageDelete.execute(message as any, client);

    const desc = send.mock.calls[0][0].embeds[0].data.description;
    expect(desc.length).toBeLessThanOrEqual(4001);
    expect(desc.endsWith("…")).toBe(true);
  });
});

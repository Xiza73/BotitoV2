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
        fetch: vi
          .fn()
          .mockResolvedValue({ send, ...overrides }),
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
    const message = createMessage({ content: "", attachments: { at: () => undefined } });

    await messageDelete.execute(message as any, client);

    expect(send).not.toHaveBeenCalled();
  });

  it("ignores messages outside the gmi2 channel", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({ channel: { id: "other" } });

    await messageDelete.execute(message as any, client);

    expect(send).not.toHaveBeenCalled();
  });

  it("DMs the owner with a content embed for a regular text message", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({ content: "test message" });

    await messageDelete.execute(message as any, client);

    expect(send).toHaveBeenCalledOnce();
    const payload = send.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
  });

  it("DMs the owner with the file attached when the deleted message had an image", async () => {
    const { client, send } = ownerMock();
    const message = createMessage({
      content: "",
      attachments: { at: () => ({ url: "https://example.com/img.png" }) },
    });

    await messageDelete.execute(message as any, client);

    expect(send).toHaveBeenCalledOnce();
    const payload = send.mock.calls[0][0];
    expect(payload.files).toEqual(["https://example.com/img.png"]);
  });
});

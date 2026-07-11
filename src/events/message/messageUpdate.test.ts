import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config", () => ({
  default: {
    gmi2Channel: "gmi2",
    ownerId: "owner",
  },
}));

import { createMockClient } from "../../test-utils/discord-mocks";
import messageUpdate from "./messageUpdate";

const author = (overrides: Record<string, any> = {}) => ({
  bot: false,
  tag: "diego#0001",
  displayAvatarURL: () => "https://example.com/diego.png",
  toString: () => "<@user-1>",
  ...overrides,
});

const baseOldMessage = (overrides: Record<string, any> = {}) => ({
  author: author(),
  content: "original",
  channel: { id: "gmi2", toString: () => "<#gmi2>" },
  ...overrides,
});

const baseNewMessage = (overrides: Record<string, any> = {}) => ({
  content: "edited",
  url: "https://discord.com/channels/1/2/3",
  ...overrides,
});

const ownerMock = () => {
  const send = vi.fn().mockResolvedValue(undefined);
  return {
    client: createMockClient({
      users: {
        fetch: vi.fn().mockResolvedValue({ send }),
      },
    }),
    send,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("messageUpdate", () => {
  it("ignores edits from bot authors", async () => {
    const { client, send } = ownerMock();
    await messageUpdate.execute(
      baseOldMessage({ author: author({ bot: true }) }) as any,
      baseNewMessage() as any,
      client
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("ignores edits where old and new content are identical", async () => {
    const { client, send } = ownerMock();
    await messageUpdate.execute(
      baseOldMessage({ content: "same" }) as any,
      baseNewMessage({ content: "same" }) as any,
      client
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("ignores edits where the old message had no content (e.g. attachment-only)", async () => {
    const { client, send } = ownerMock();
    await messageUpdate.execute(
      baseOldMessage({ content: "" }) as any,
      baseNewMessage() as any,
      client
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("ignores edits outside the gmi2 channel", async () => {
    const { client, send } = ownerMock();
    await messageUpdate.execute(
      baseOldMessage({ channel: { id: "other", toString: () => "<#other>" } }) as any,
      baseNewMessage() as any,
      client
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("DMs the owner with the diff embed on a real edit", async () => {
    const { client, send } = ownerMock();
    await messageUpdate.execute(
      baseOldMessage() as any,
      baseNewMessage() as any,
      client
    );
    expect(send).toHaveBeenCalledOnce();
    const embed = send.mock.calls[0][0].embeds[0].data;
    expect(embed.description).toBe("original"); // original as the body
    expect(embed.fields[0].value).toBe("edited"); // new content below
    expect(embed.fields[1].value).toContain("Ir al mensaje");
    expect(embed.footer.text).toBe("✏️ Editado");
  });
});

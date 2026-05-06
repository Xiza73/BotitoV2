import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("death-games", () => ({
  __esModule: true,
  default: {
    Hangman: class {
      game = { ascii: ["_", "_"], turno: "user-1", ended: false, vidas: 7 };
      on = vi.fn();
      find = vi.fn().mockReturnValue(true);
    },
    Roulette: class {
      game = { turno: "user-1", posicion: 1 };
      elegir = vi.fn().mockReturnValue(false);
    },
  },
}));

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import ruleta from "./ruleta";

const sendableChannel = () => ({
  isTextBased: () => true,
  isSendable: () => true,
  send: vi.fn().mockResolvedValue({ id: "msg" }),
  createMessageCollector: vi.fn().mockReturnValue({ on: vi.fn() }),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/ruleta", () => {
  it("happy path: replies and registers the collector", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
    vi.mocked(client.users.fetch).mockResolvedValue({
      id: "player-2",
      bot: false,
      username: "Player2",
      toString: () => "<@player-2>",
    } as any);

    await ruleta.run(client, interaction, [arg("player2", "player-2")]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    expect(interaction.channel.createMessageCollector).toHaveBeenCalled();
  });

  it("rejects ephemerally when the channel is not sendable", async () => {
    const interaction = createMockInteraction({
      channel: {
        isTextBased: () => true,
        isSendable: () => false,
      },
    });

    await ruleta.run(createMockClient(), interaction, [arg("player2", "p2")]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.ephemeral).toBe(true);
  });

  it("rejects when any chosen player is a bot", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
    vi.mocked(client.users.fetch).mockImplementation((async (id: string) => ({
      id,
      bot: id === "bot-id",
      username: `user-${id}`,
    })) as any);

    await ruleta.run(client, interaction, [arg("player2", "bot-id")]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.ephemeral).toBe(true);
  });
});

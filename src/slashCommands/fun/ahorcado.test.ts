import { MessageFlags } from "discord.js";
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
import ahorcado from "./ahorcado";

const sendableChannel = () => {
  const send = vi.fn().mockResolvedValue({ id: "msg" });
  const createMessageCollector = vi.fn().mockReturnValue({ on: vi.fn() });
  return {
    isTextBased: () => true,
    isSendable: () => true,
    send,
    createMessageCollector,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/ahorcado", () => {
  it("when bot_picks_word is true, replies and starts the game without DMing the user", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
    // override the user fetched (player2) to be non-bot
    vi.mocked(client.users.fetch).mockResolvedValue({
      id: "player-2",
      bot: false,
      username: "Player2",
      toString: () => "<@player-2>",
    } as any);

    await ahorcado.run(client, interaction, [
      arg("player2", "player-2"),
      arg("bot_picks_word", true),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    expect(interaction.channel.send).toHaveBeenCalled(); // initial board
    expect(interaction.channel.createMessageCollector).toHaveBeenCalled();
  });

  it("rejects ephemerally when the channel is not sendable", async () => {
    const interaction = createMockInteraction({
      channel: {
        isTextBased: () => true,
        isSendable: () => false,
        send: vi.fn(),
      },
    });

    await ahorcado.run(createMockClient(), interaction, [
      arg("player2", "player-2"),
      arg("bot_picks_word", true),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("rejects when any chosen player is a bot", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();

    // Override fetch so the second call returns a bot user.
    vi.mocked(client.users.fetch).mockImplementation((async (id: string) => {
      if (id === "player-2-bot") {
        return { id, bot: true, username: "BotUser" };
      }
      return { id, bot: false, username: `user-${id}` };
    }) as any);

    await ahorcado.run(client, interaction, [
      arg("player2", "player-2-bot"),
      arg("bot_picks_word", true),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("bots");
  });
});

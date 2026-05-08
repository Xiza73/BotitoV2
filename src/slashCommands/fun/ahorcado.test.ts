import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("death-games", () => ({
  __esModule: true,
  default: {
    Hangman: class {
      game = {
        ascii: ["_", "_"],
        turno: "user-1",
        ended: false,
        vidas: 7,
        letrasIncorrectas: [],
      };
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
  it("happy path with bot_picks_word=true: replies, sends kickoff embed, registers idle-timed collector", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
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
    expect(interaction.channel.send).toHaveBeenCalled();
    const sentEmbed = interaction.channel.send.mock.calls[0][0].embeds[0].data;
    expect(sentEmbed.title).toBe("🎯 Ahorcado");
    expect(sentEmbed.color).toBe(0xfee75c); // fun yellow
    expect(sentEmbed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(sentEmbed.author).toBeUndefined();

    expect(interaction.channel.createMessageCollector).toHaveBeenCalled();
    const collectorOpts =
      interaction.channel.createMessageCollector.mock.calls[0][0];
    expect(collectorOpts.idle).toBe(5 * 60 * 1000);
  });

  it("solo play: allows playing alone if bot_picks_word=true", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
    vi.mocked(client.users.fetch).mockImplementation((async (id: string) => ({
      id,
      bot: false,
      username: `user-${id}`,
      toString: () => `<@${id}>`,
    })) as any);

    await ahorcado.run(client, interaction, [arg("bot_picks_word", true)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    expect(interaction.channel.send).toHaveBeenCalled();
    const desc = interaction.channel.send.mock.calls[0][0].embeds[0].data
      .description;
    expect(desc).toContain("jugando solo");
  });

  it("rejects solo + bot_picks_word=false (would be guessing your own word)", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });

    await ahorcado.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("bot_picks_word");
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

  it("rejects duplicate players (same user listed twice)", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });

    await ahorcado.run(createMockClient(), interaction, [
      arg("player2", "duplicate"),
      arg("player3", "duplicate"),
      arg("bot_picks_word", true),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("dos veces");
    expect(interaction.channel.createMessageCollector).not.toHaveBeenCalled();
  });

  it("rejects when initiator lists themself as player2", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });

    await ahorcado.run(createMockClient(), interaction, [
      arg("player2", "user-1"), // discord-mocks default initiator id
      arg("bot_picks_word", true),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("dos veces");
  });
});

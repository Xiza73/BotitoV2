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
  it("happy path: replies with branded kickoff embed and registers an idle-timed collector", async () => {
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
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    const embed = payload.embeds[0].data;
    expect(embed.title).toBe("🔫 Ruleta rusa");
    expect(embed.color).toBe(0xfee75c); // fun yellow
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.author).toBeUndefined();

    // collector registered with idle timeout
    expect(interaction.channel.createMessageCollector).toHaveBeenCalledOnce();
    const collectorOpts = interaction.channel.createMessageCollector.mock.calls[0][0];
    expect(collectorOpts.idle).toBe(5 * 60 * 1000);
    expect(typeof collectorOpts.filter).toBe("function");
  });

  it("kickoff embed lists every player", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
    vi.mocked(client.users.fetch).mockImplementation((async (id: string) => ({
      id,
      bot: false,
      username: `user-${id}`,
      toString: () => `<@${id}>`,
    })) as any);

    await ruleta.run(client, interaction, [
      arg("player2", "p2"),
      arg("player3", "p3"),
      arg("player4", "p4"),
    ]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    const playersField = embed.fields.find((f: any) => f.name === "👥 Jugadores");
    expect(playersField.value).toContain("<@user-1>");
    expect(playersField.value).toContain("<@p2>");
    expect(playersField.value).toContain("<@p3>");
    expect(playersField.value).toContain("<@p4>");
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
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
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
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("bots");
    // Doesn't even register a collector
    expect(interaction.channel.createMessageCollector).not.toHaveBeenCalled();
  });

  it("solo play: works with no extra players (kickoff title shows 'Jugador' singular)", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
    vi.mocked(client.users.fetch).mockImplementation((async (id: string) => ({
      id,
      bot: false,
      username: `user-${id}`,
      toString: () => `<@${id}>`,
    })) as any);

    await ruleta.run(client, interaction, []); // no player2

    expect(interaction.reply).toHaveBeenCalledOnce();
    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.fields[0].name).toBe("👤 Jugador");
    expect(embed.description).toContain("juega solo");
    expect(interaction.channel.createMessageCollector).toHaveBeenCalled();
  });

  it("rejects when the same user appears more than once across player slots", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });

    await ruleta.run(createMockClient(), interaction, [
      arg("player2", "duplicate"),
      arg("player3", "duplicate"),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("dos veces");
    // No collector since we bailed early
    expect(interaction.channel.createMessageCollector).not.toHaveBeenCalled();
  });

  it("rejects when the initiator lists themself as player2", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });

    await ruleta.run(createMockClient(), interaction, [
      // discord-mocks defaults the interaction.user.id to 'user-1'
      arg("player2", "user-1"),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("dos veces");
  });

  it("alive update is sent as a branded embed (not plain text)", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
    vi.mocked(client.users.fetch).mockResolvedValue({
      id: "player-2",
      bot: false,
      username: "Player2",
      toString: () => "<@player-2>",
    } as any);

    await ruleta.run(client, interaction, [arg("player2", "player-2")]);

    // Capture the collect handler that was registered on the collector
    const collectorMock = interaction.channel.createMessageCollector.mock
      .results[0].value;
    const collectHandler = collectorMock.on.mock.calls.find(
      (c: any) => c[0] === "collect"
    )[1];

    // Simulate a 'roll' message from the current-turn player
    await collectHandler({
      author: { id: "user-1", toString: () => "<@user-1>" },
      content: "roll",
    });

    // channel.send should have been called with an embeds payload
    const sendArg = interaction.channel.send.mock.calls[0][0];
    expect(sendArg.embeds).toBeDefined();
    expect(sendArg.embeds).toHaveLength(1);
    const aliveEmbed = sendArg.embeds[0].data;
    expect(aliveEmbed.color).toBe(0xfee75c);
    expect(aliveEmbed.footer.text).toMatch(/Xiza Bot v\d+/);
  });

  it("collector filter only matches the current player typing 'roll'", async () => {
    const interaction = createMockInteraction({ channel: sendableChannel() });
    const client = createMockClient();
    vi.mocked(client.users.fetch).mockResolvedValue({
      id: "player-2",
      bot: false,
      username: "Player2",
      toString: () => "<@player-2>",
    } as any);

    await ruleta.run(client, interaction, [arg("player2", "player-2")]);

    const filter = interaction.channel.createMessageCollector.mock.calls[0][0].filter;
    // Mock Roulette.game.turno is "user-1"
    expect(filter({ author: { id: "user-1" }, content: "roll" })).toBe(true);
    expect(filter({ author: { id: "user-1" }, content: "ROLL" })).toBe(true); // case-insensitive
    expect(filter({ author: { id: "user-1" }, content: "fire" })).toBe(false);
    expect(filter({ author: { id: "intruder" }, content: "roll" })).toBe(false);
  });
});

import { Collection } from "discord.js";
import { vi } from "vitest";

/**
 * Builds a ChatInputCommandInteraction-shaped object with the surface
 * area our slash command run() handlers actually touch. Override any
 * field via the `overrides` arg for per-test customization.
 *
 * The returned object is typed as `any` deliberately — slash commands
 * accept ChatInputCommandInteraction whose real type is enormous and
 * mostly irrelevant for unit tests.
 */
export const createMockInteraction = (overrides: Record<string, any> = {}) => {
  const reply = vi.fn().mockResolvedValue({ id: "reply-msg" });
  const deferReply = vi.fn().mockResolvedValue(undefined);
  const editReply = vi.fn().mockResolvedValue({ id: "edited-msg" });
  const channelSend = vi.fn().mockResolvedValue({
    id: "channel-msg",
    createdAt: new Date(),
    delete: vi.fn().mockResolvedValue(undefined),
  });

  return {
    reply,
    deferReply,
    editReply,
    user: {
      id: "user-1",
      tag: "tester#0001",
      displayAvatarURL: () => "https://example.com/avatar.png",
    },
    member: {
      permissions: {
        has: vi.fn().mockReturnValue(true),
      },
    },
    guild: {
      name: "TestGuild",
      memberCount: 5,
    },
    guildId: "guild-1",
    channelId: "channel-1",
    channel: {
      isSendable: () => true,
      send: channelSend,
      bulkDelete: vi.fn().mockResolvedValue({ size: 5 }),
    },
    createdAt: new Date(),
    createdTimestamp: Date.now(),
    commandName: "test",
    isChatInputCommand: () => true,
    ...overrides,
  } as any;
};

export const createMockClient = (overrides: Record<string, any> = {}) =>
  ({
    user: {
      username: "TestBot",
      avatarURL: () => "https://example.com/bot.png",
    },
    users: {
      fetch: vi.fn().mockImplementation((id: string) =>
        Promise.resolve({
          id,
          tag: `user-${id}#0001`,
          username: `user-${id}`,
          avatarURL: () => `https://example.com/${id}.png`,
          displayAvatarURL: () => `https://example.com/${id}.png`,
        })
      ),
    },
    config: {
      ownerId: "owner-1",
      gmi2Channel: "gmi2-channel",
    },
    slashCommands: new Collection<string, any>(),
    commands: new Collection<string, any>(),
    ws: { ping: 50 },
    channels: {
      cache: new Collection<string, any>(),
      fetch: vi.fn().mockImplementation((id: string) =>
        Promise.resolve({
          id,
          name: `channel-${id}`,
          type: 0, // ChannelType.GuildText
          guild: { id: "guild-1", name: "TestGuild" },
          parent: null,
          nsfw: false,
        })
      ),
    },
    guilds: { cache: new Collection<string, any>() },
    application: {
      commands: {
        set: vi.fn().mockResolvedValue(undefined),
      },
    },
    ...overrides,
  }) as any;

/**
 * Convenience builder for the Argument[] our slash commands receive.
 * Skips the strict typing on `type` since interactionCreate populates
 * it with `option.type as any` at runtime anyway.
 */
export const arg = (name: string, value: string | number | boolean) =>
  ({
    name,
    type: 0,
    value,
  }) as any;

export const subCommandArg = (
  name: string,
  args?: { name: string; value: string | number | boolean }[]
) =>
  ({
    name,
    type: 1, // ApplicationCommandOptionType.Subcommand
    args: args?.map((a) => ({ name: a.name, type: 0, value: a.value })),
  }) as any;

import { ApplicationCommandOptionType } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockClient } from "../../test-utils/discord-mocks";
import interactionCreate from "./interactionCreate";

const createInteraction = (overrides: Record<string, any> = {}) => {
  const reply = vi.fn().mockResolvedValue(undefined);
  return {
    reply,
    isChatInputCommand: () => true,
    command: { id: "cmd" },
    commandName: "ping",
    user: { id: "user-1" },
    options: { data: [] },
    ...overrides,
  } as any;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("interactionCreate", () => {
  it("returns early when the interaction isn't a ChatInputCommand", () => {
    const interaction = createInteraction({ isChatInputCommand: () => false });
    interactionCreate.execute(interaction, createMockClient());

    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("returns early when interaction.command is null", () => {
    const interaction = createInteraction({ command: null });
    interactionCreate.execute(interaction, createMockClient());

    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("replies 'an Error' when the command name isn't registered", () => {
    const client = createMockClient(); // empty slashCommands collection
    const interaction = createInteraction();

    interactionCreate.execute(interaction, client);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.content).toBe("an Error");
  });

  it("rejects ephemerally when ownerOnly is set and caller is not the owner", () => {
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const command = {
      name: "secret",
      ownerOnly: true,
      run: vi.fn(),
    };
    client.slashCommands.set("secret", command);

    const interaction = createInteraction({
      commandName: "secret",
      user: { id: "intruder" },
    });

    interactionCreate.execute(interaction, client);

    expect(command.run).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.ephemeral).toBe(true);
  });

  it("dispatches to command.run with parsed args on the happy path", () => {
    const client = createMockClient();
    const command = {
      name: "ping",
      ownerOnly: false,
      run: vi.fn(),
    };
    client.slashCommands.set("ping", command);

    const interaction = createInteraction({
      options: {
        data: [
          { name: "foo", type: 3, value: "bar" }, // STRING
        ],
      },
    });

    interactionCreate.execute(interaction, client);

    expect(command.run).toHaveBeenCalledOnce();
    const [passedClient, passedInteraction, args] = command.run.mock.calls[0];
    expect(passedClient).toBe(client);
    expect(passedInteraction).toBe(interaction);
    expect(args).toEqual([{ name: "foo", type: 3, value: "bar" }]);
  });

  it("expands subcommand option arrays into the args[].args field", () => {
    const client = createMockClient();
    const command = { name: "poke", ownerOnly: false, run: vi.fn() };
    client.slashCommands.set("poke", command);

    const interaction = createInteraction({
      commandName: "poke",
      options: {
        data: [
          {
            name: "type",
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: "name", type: 3, value: "fire" }],
          },
        ],
      },
    });

    interactionCreate.execute(interaction, client);

    expect(command.run).toHaveBeenCalledOnce();
    const args = command.run.mock.calls[0][2];
    expect(args[0].args).toEqual([{ name: "name", type: 3, value: "fire" }]);
  });
});

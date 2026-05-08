import { Collection, MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import help from "./help";

const stubCommand = (
  name: string,
  category: string | null,
  overrides: Record<string, any> = {}
) => ({
  name,
  category,
  description: `Test ${name}`,
  ownerOnly: false,
  run: () => Promise.resolve(),
  ...overrides,
});

const buildClient = (commands: Record<string, any>, ownerId = "owner-1") => {
  const slashCommands = new Collection<string, any>();
  for (const [name, cmd] of Object.entries(commands)) slashCommands.set(name, cmd);
  return createMockClient({
    slashCommands,
    config: { ownerId, gmi2Channel: "gmi2" },
  });
};

describe("/help — listing", () => {
  it("lists all categories with their commands by default", async () => {
    const client = buildClient({
      ping: stubCommand("ping", "info"),
      flip: stubCommand("flip", "fun"),
      clear: stubCommand("clear", "mod"),
    });

    const interaction = createMockInteraction();
    await help.run(client, interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(payload.flags).toBe(MessageFlags.Ephemeral); // default
  });

  it("becomes public when public:true is passed", async () => {
    const client = buildClient({ ping: stubCommand("ping", "info") });

    const interaction = createMockInteraction();
    await help.run(client, interaction, [arg("public", true)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBeUndefined();
  });

  it("filters by category when the option is passed", async () => {
    const client = buildClient({
      ping: stubCommand("ping", "info"),
      flip: stubCommand("flip", "fun"),
    });

    const interaction = createMockInteraction();
    await help.run(client, interaction, [arg("category", "fun")]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds[0].data.title).toContain("Fun");
  });

  it("hides ownerOnly commands from non-owners", async () => {
    const client = buildClient(
      {
        ping: stubCommand("ping", "info"),
        secret: stubCommand("secret", "info", { ownerOnly: true }),
      },
      "owner-1"
    );

    const interaction = createMockInteraction({ user: { id: "non-owner" } });
    await help.run(client, interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    const fieldsValues = payload.embeds[0].data.fields.map((f: any) => f.value).join(" ");
    expect(fieldsValues).toContain("/ping");
    expect(fieldsValues).not.toContain("/secret");
  });

  it("shows ownerOnly commands to the owner", async () => {
    const client = buildClient(
      {
        ping: stubCommand("ping", "info"),
        secret: stubCommand("secret", "info", { ownerOnly: true }),
      },
      "owner-1"
    );

    const interaction = createMockInteraction({ user: { id: "owner-1" } });
    await help.run(client, interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    const fieldsValues = payload.embeds[0].data.fields.map((f: any) => f.value).join(" ");
    expect(fieldsValues).toContain("/secret");
  });
});

describe("/help — detail view", () => {
  it("shows the command's options and examples when present", async () => {
    const command = stubCommand("ahorcado", "fun", {
      options: [
        {
          name: "player2",
          description: "Segundo jugador",
          required: true,
        },
        {
          name: "bot_picks_word",
          description: "Si true, el bot elige",
          required: false,
        },
      ],
      examples: ["/ahorcado player2:@bob", "/ahorcado player2:@bob bot_picks_word:true"],
    });
    const client = buildClient({ ahorcado: command });

    const interaction = createMockInteraction();
    await help.run(client, interaction, [arg("command", "ahorcado")]);

    const payload = interaction.reply.mock.calls[0][0];
    const fields = payload.embeds[0].data.fields;
    expect(fields.find((f: any) => f.name === "Opciones").value).toContain("player2");
    expect(fields.find((f: any) => f.name === "Ejemplos").value).toContain("/ahorcado");
  });

  it("returns an ephemeral notice for unknown commands", async () => {
    const client = buildClient({ ping: stubCommand("ping", "info") });

    const interaction = createMockInteraction();
    await help.run(client, interaction, [arg("command", "ghost")]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("ghost");
  });

  it("hides ownerOnly commands from non-owners even in detail view", async () => {
    const client = buildClient(
      { secret: stubCommand("secret", "info", { ownerOnly: true }) },
      "owner-1"
    );

    const interaction = createMockInteraction({ user: { id: "non-owner" } });
    await help.run(client, interaction, [arg("command", "secret")]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("secret");
  });
});

describe("/help — autocomplete", () => {
  const buildAutocompleteInteraction = (
    focusedName: string,
    focusedValue: string,
    userId = "user-1"
  ) => ({
    user: { id: userId },
    options: {
      getFocused: vi.fn().mockReturnValue({ name: focusedName, value: focusedValue }),
    },
    respond: vi.fn().mockResolvedValue(undefined),
  }) as any;

  it("suggests command names that contain the query (substring match)", async () => {
    const client = buildClient({
      ping: stubCommand("ping", "info"),
      poke: stubCommand("poke", "fun"),
      flip: stubCommand("flip", "fun"),
    });

    const interaction = buildAutocompleteInteraction("command", "po");
    await help.autocomplete!(client, interaction);

    expect(interaction.respond).toHaveBeenCalledOnce();
    const values = interaction.respond.mock.calls[0][0].map((c: any) => c.value);
    expect(values).toEqual(["poke"]);
  });

  it("hides ownerOnly commands from non-owner autocomplete", async () => {
    const client = buildClient(
      {
        ping: stubCommand("ping", "info"),
        secret: stubCommand("secret", "info", { ownerOnly: true }),
      },
      "owner-1"
    );

    const interaction = buildAutocompleteInteraction("command", "", "non-owner");
    await help.autocomplete!(client, interaction);

    const values = interaction.respond.mock.calls[0][0].map((c: any) => c.value);
    expect(values).toContain("ping");
    expect(values).not.toContain("secret");
  });

  it("suggests categories for the 'category' option", async () => {
    const client = buildClient({
      ping: stubCommand("ping", "info"),
      flip: stubCommand("flip", "fun"),
    });

    const interaction = buildAutocompleteInteraction("category", "");
    await help.autocomplete!(client, interaction);

    const values = interaction.respond.mock.calls[0][0].map((c: any) => c.value);
    expect(values).toContain("info");
    expect(values).toContain("fun");
  });
});

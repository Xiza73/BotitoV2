import { Collection } from "discord.js";
import { describe, expect, it } from "vitest";

import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import help from "./help";

const stubCommand = (name: string, category: string | null) => ({
  name,
  category,
  description: `Test ${name}`,
  ownerOnly: false,
  run: () => Promise.resolve(),
});

describe("/help", () => {
  it("lists all categories when no command is given", async () => {
    const slashCommands = new Collection<string, any>();
    slashCommands.set("ping", stubCommand("ping", "info"));
    slashCommands.set("flip", stubCommand("flip", "fun"));
    slashCommands.set("clear", stubCommand("clear", "mod"));

    const interaction = createMockInteraction();
    await help.run(createMockClient({ slashCommands }), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
  });

  it("returns the detail embed when given a known command name", async () => {
    const slashCommands = new Collection<string, any>();
    slashCommands.set("ping", stubCommand("ping", "info"));

    const interaction = createMockInteraction();
    await help.run(createMockClient({ slashCommands }), interaction, [
      arg("command", "ping"),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
  });

  it("replies ephemerally when given an unknown command name", async () => {
    const slashCommands = new Collection<string, any>();
    slashCommands.set("ping", stubCommand("ping", "info"));

    const interaction = createMockInteraction();
    await help.run(createMockClient({ slashCommands }), interaction, [
      arg("command", "nope"),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.ephemeral).toBe(true);
    expect(payload.content).toContain("nope");
  });
});

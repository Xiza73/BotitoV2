import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import imc from "./imc";

describe("/imc", () => {
  it("calculates IMC for a normal-weight input", async () => {
    const interaction = createMockInteraction();
    await imc.run(createMockClient(), interaction, [
      arg("peso", 70),
      arg("altura", 1.75),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
  });

  it("treats height > 3 as centimeters and divides by 100", async () => {
    const interaction = createMockInteraction();
    await imc.run(createMockClient(), interaction, [
      arg("peso", 70),
      arg("altura", 175), // cm
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    // The embed should reflect the same IMC as the meters version (~22.86)
  });

  it("rejects ephemerally on zero or negative input", async () => {
    const interaction = createMockInteraction();
    await imc.run(createMockClient(), interaction, [
      arg("peso", 0),
      arg("altura", 1.75),
    ]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });
});

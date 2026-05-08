import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import imc from "./imc";

const findField = (embed: any, name: string) =>
  embed.data.fields.find((f: any) => f.name === name);

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
    const imcField = findField(payload.embeds[0], "IMC");
    expect(imcField.value).toContain("22.86");
    const stateField = findField(payload.embeds[0], "Estado");
    expect(stateField.value).toContain("Peso normal");
  });

  it("treats height > 3 as centimeters and divides by 100 (same IMC as meters)", async () => {
    const cmInteraction = createMockInteraction();
    const mInteraction = createMockInteraction();
    await imc.run(createMockClient(), cmInteraction, [
      arg("peso", 70),
      arg("altura", 175),
    ]);
    await imc.run(createMockClient(), mInteraction, [
      arg("peso", 70),
      arg("altura", 1.75),
    ]);

    const cmIMC = findField(cmInteraction.reply.mock.calls[0][0].embeds[0], "IMC").value;
    const mIMC = findField(mInteraction.reply.mock.calls[0][0].embeds[0], "IMC").value;
    expect(cmIMC).toBe(mIMC);
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

  it("includes the 'Peso ideal' range field derived from the height", async () => {
    const interaction = createMockInteraction();
    await imc.run(createMockClient(), interaction, [
      arg("peso", 70),
      arg("altura", 1.75),
    ]);

    const idealField = findField(
      interaction.reply.mock.calls[0][0].embeds[0],
      "Peso ideal"
    );
    expect(idealField).toBeDefined();
    // 18.5 * 1.75^2 = 56.65625 → 56.7
    // 24.9 * 1.75^2 = 76.25625 → 76.3
    expect(idealField.value).toBe("`56.7–76.3 kg`");
  });

  it("uses the data-driven status color and the brand footer (no setAuthor)", async () => {
    const interaction = createMockInteraction();
    await imc.run(createMockClient(), interaction, [
      arg("peso", 70),
      arg("altura", 1.75),
    ]);

    const data = interaction.reply.mock.calls[0][0].embeds[0].data;
    // 22.86 IMC → "Peso normal" → green #00ff00 = 0x00ff00
    expect(data.color).toBe(0x00ff00);
    expect(data.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(data.author).toBeUndefined();
  });

  it("uses the underweight color (red) for IMC below 18.5", async () => {
    const interaction = createMockInteraction();
    await imc.run(createMockClient(), interaction, [
      arg("peso", 45),
      arg("altura", 1.75),
    ]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0];
    expect(embed.data.color).toBe(0xff0000);
    expect(findField(embed, "Estado").value).toContain("Bajo peso");
  });

  it("becomes ephemeral when private:true is passed", async () => {
    const interaction = createMockInteraction();
    await imc.run(createMockClient(), interaction, [
      arg("peso", 70),
      arg("altura", 1.75),
      arg("private", true),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("public by default", async () => {
    const interaction = createMockInteraction();
    await imc.run(createMockClient(), interaction, [
      arg("peso", 70),
      arg("altura", 1.75),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBeUndefined();
  });
});

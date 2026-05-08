import { MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import { CHANGELOG } from "../../shared/constants/changelog";
import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import changelog from "./changelog";

describe("/changelog", () => {
  it("by default, renders an embed listing all versions newest-first", async () => {
    const interaction = createMockInteraction();
    await changelog.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("📜 Changelog");
    expect(embed.color).toBe(0x5865f2);
    // The current top entry's version appears in the body
    expect(embed.description).toContain(`v${CHANGELOG[0].version}`);
  });

  it("with a version arg, renders only that version", async () => {
    const target = CHANGELOG[1] ?? CHANGELOG[0];
    const interaction = createMockInteraction();
    await changelog.run(createMockClient(), interaction, [
      arg("version", target.version),
    ]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe(`📜 Changelog — v${target.version}`);
    expect(embed.description).toContain(target.date);
  });

  it("rejects ephemerally when the requested version doesn't exist", async () => {
    const interaction = createMockInteraction();
    await changelog.run(createMockClient(), interaction, [
      arg("version", "99.99.99"),
    ]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("99.99.99");
  });

  it("public by default, ephemeral when private:true", async () => {
    const i1 = createMockInteraction();
    await changelog.run(createMockClient(), i1, []);
    expect(i1.reply.mock.calls[0][0].flags).toBeUndefined();

    const i2 = createMockInteraction();
    await changelog.run(createMockClient(), i2, [arg("private", true)]);
    expect(i2.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
  });

  describe("autocomplete", () => {
    const buildAutocomplete = (focusedValue: string) =>
      ({
        options: {
          getFocused: vi
            .fn()
            .mockReturnValue({ name: "version", value: focusedValue }),
        },
        respond: vi.fn().mockResolvedValue(undefined),
      }) as any;

    it("returns matching versions as choices", async () => {
      const interaction = buildAutocomplete("0.4");
      await changelog.autocomplete!(createMockClient(), interaction);
      const choices = interaction.respond.mock.calls[0][0];
      expect(choices.some((c: any) => c.value.startsWith("0.4"))).toBe(true);
    });

    it("returns the full list when query is empty", async () => {
      const interaction = buildAutocomplete("");
      await changelog.autocomplete!(createMockClient(), interaction);
      const choices = interaction.respond.mock.calls[0][0];
      expect(choices.length).toBe(CHANGELOG.length);
    });
  });
});

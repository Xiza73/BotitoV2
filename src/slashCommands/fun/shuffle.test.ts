import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import {
  createMockClient,
  createMockInteraction,
  subCommandArg,
} from "../../test-utils/discord-mocks";
import shuffle from "./shuffle";

describe("/shuffle", () => {
  describe("words subcommand", () => {
    it("replies with the shuffled list and an original-list field", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [{ name: "list", value: "ana bob carla david" }]),
      ]);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.embeds).toHaveLength(1);
      const embed = payload.embeds[0].data;
      expect(embed.title).toBe("🔀 Lista aleatoria");
      const original = embed.fields.find((f: any) => f.name === "Lista original");
      expect(original.value).toBe("ana, bob, carla, david");
    });

    it("accepts comma-separated input", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [{ name: "list", value: "ana, bob, carla" }]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      const embed = payload.embeds[0].data;
      const original = embed.fields.find((f: any) => f.name === "Lista original");
      expect(original.value).toBe("ana, bob, carla");
    });

    it("uses the singular 'Ganador' title when winners=1", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob carla" },
          { name: "winners", value: 1 },
        ]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.embeds[0].data.title).toBe("🏆 Ganador");
    });

    it("caps winners to the list length when winners > items", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob" },
          { name: "winners", value: 99 },
        ]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      // capped to 2 → plural
      expect(payload.embeds[0].data.title).toBe("🏆 Ganadores (2)");
    });

    it("rejects ephemerally when the list has fewer than 2 items", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [{ name: "list", value: "ana" }]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.flags).toBe(MessageFlags.Ephemeral);
      expect(payload.content).toContain("al menos 2");
    });

    it("rejects ephemerally when winners < 1", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob carla" },
          { name: "winners", value: 0 },
        ]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.flags).toBe(MessageFlags.Ephemeral);
      expect(payload.content).toContain("al menos 1");
    });
  });

  describe("numbers subcommand", () => {
    it("replies with a shuffled numeric list", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("numbers", [{ name: "quantity", value: 5 }]),
      ]);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.embeds[0].data.title).toBe("🔀 Números (1–5)");
    });

    it("clamps quantity above 50 down to 50", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("numbers", [{ name: "quantity", value: 999 }]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.embeds[0].data.title).toBe("🔀 Números (1–50)");
    });

    it("rejects ephemerally when quantity < 1", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("numbers", [{ name: "quantity", value: 0 }]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.flags).toBe(MessageFlags.Ephemeral);
    });
  });

  describe("branding", () => {
    it("uses the fun-category color and the brand footer (no setAuthor)", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [{ name: "list", value: "ana bob carla" }]),
      ]);

      const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
      expect(embed.color).toBe(0xfee75c);
      expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
      expect(embed.author).toBeUndefined();
    });

    it("becomes ephemeral when private:true is passed (words)", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob carla" },
          { name: "private", value: true },
        ]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.flags).toBe(MessageFlags.Ephemeral);
    });

    it("becomes ephemeral when private:true is passed (numbers)", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("numbers", [
          { name: "quantity", value: 5 },
          { name: "private", value: true },
        ]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.flags).toBe(MessageFlags.Ephemeral);
    });
  });
});

import { MessageFlags } from "discord.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMockClient,
  createMockInteraction,
  subCommandArg,
} from "../../test-utils/discord-mocks";
import shuffle from "./shuffle";

describe("/shuffle", () => {
  describe("words subcommand — no winners (instant)", () => {
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
      const original = embed.fields.find(
        (f: any) => f.name === "Lista original"
      );
      expect(original.value).toBe("ana, bob, carla, david");
    });

    it("accepts comma-separated input", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [{ name: "list", value: "ana, bob, carla" }]),
      ]);

      const payload = interaction.reply.mock.calls[0][0];
      const embed = payload.embeds[0].data;
      const original = embed.fields.find(
        (f: any) => f.name === "Lista original"
      );
      expect(original.value).toBe("ana, bob, carla");
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
  });

  describe("words subcommand — winners (animated raffle)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("defers, edits N teaser frames, then edits with the final winners embed", async () => {
      const interaction = createMockInteraction();
      const promise = shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob carla" },
          { name: "winners", value: 1 },
        ]),
      ]);

      // Drive the timers so all setTimeout-based sleeps resolve
      await vi.runAllTimersAsync();
      await promise;

      expect(interaction.deferReply).toHaveBeenCalledOnce();
      // 3 teaser frames + 1 final reveal = 4 editReply calls
      expect(interaction.editReply).toHaveBeenCalledTimes(4);
      expect(interaction.reply).not.toHaveBeenCalled();

      // The final edit should carry the winners embed
      const finalCall = interaction.editReply.mock.calls.at(-1)![0];
      expect(finalCall.embeds[0].data.title).toBe("🏆 Ganador");
    });

    it("uses 'Ganadores (N)' title for plural winners", async () => {
      const interaction = createMockInteraction();
      const promise = shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob carla david" },
          { name: "winners", value: 3 },
        ]),
      ]);

      await vi.runAllTimersAsync();
      await promise;

      const finalCall = interaction.editReply.mock.calls.at(-1)![0];
      expect(finalCall.embeds[0].data.title).toBe("🏆 Ganadores (3)");
    });

    it("caps winners to the list length when winners > items", async () => {
      const interaction = createMockInteraction();
      const promise = shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob" },
          { name: "winners", value: 99 },
        ]),
      ]);

      await vi.runAllTimersAsync();
      await promise;

      const finalCall = interaction.editReply.mock.calls.at(-1)![0];
      expect(finalCall.embeds[0].data.title).toBe("🏆 Ganadores (2)");
    });

    it("rejects ephemerally when winners < 1 (no defer, no animation)", async () => {
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
      expect(interaction.deferReply).not.toHaveBeenCalled();
      expect(interaction.editReply).not.toHaveBeenCalled();
    });

    it("teaser frames use the '🎰 Sorteando...' title before the reveal", async () => {
      const interaction = createMockInteraction();
      const promise = shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob carla" },
          { name: "winners", value: 1 },
        ]),
      ]);

      await vi.runAllTimersAsync();
      await promise;

      const calls = interaction.editReply.mock.calls;
      // First three calls are teasers, last is the reveal
      for (let i = 0; i < 3; i++) {
        expect(calls[i][0].embeds[0].data.title).toBe("🎰 Sorteando...");
      }
    });

    it("respects private:true on deferReply (animation runs ephemerally)", async () => {
      const interaction = createMockInteraction();
      const promise = shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob carla" },
          { name: "winners", value: 1 },
          { name: "private", value: true },
        ]),
      ]);

      await vi.runAllTimersAsync();
      await promise;

      const deferPayload = interaction.deferReply.mock.calls[0][0];
      expect(deferPayload.flags).toBe(MessageFlags.Ephemeral);
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

    it("becomes ephemeral when private:true is passed (words, no winners)", async () => {
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

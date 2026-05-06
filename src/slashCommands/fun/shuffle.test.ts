import { describe, expect, it } from "vitest";

import { arg, createMockClient, createMockInteraction, subCommandArg } from "../../test-utils/discord-mocks";
import shuffle from "./shuffle";

describe("/shuffle", () => {
  describe("words subcommand", () => {
    it("replies with the shuffled list", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [{ name: "list", value: "ana bob carla david" }]),
      ]);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.embeds).toHaveLength(1);
    });

    it("respects the winners cap", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("words", [
          { name: "list", value: "ana bob carla" },
          { name: "winners", value: 1 },
        ]),
      ]);

      expect(interaction.reply).toHaveBeenCalledOnce();
    });
  });

  describe("numbers subcommand", () => {
    it("replies with a shuffled numeric list", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("numbers", [{ name: "quantity", value: 5 }]),
      ]);

      expect(interaction.reply).toHaveBeenCalledOnce();
    });

    it("clamps quantity above 20 down to 20", async () => {
      const interaction = createMockInteraction();
      await shuffle.run(createMockClient(), interaction, [
        subCommandArg("numbers", [{ name: "quantity", value: 99 }]),
      ]);

      expect(interaction.reply).toHaveBeenCalledOnce();
    });
  });
});

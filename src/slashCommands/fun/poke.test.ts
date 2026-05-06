import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockClient, createMockInteraction, subCommandArg } from "../../test-utils/discord-mocks";
import poke from "./poke";

const fakePokemon = {
  name: "charmander",
  order: 4,
  sprites: {
    front_default: "url-default",
    front_female: null,
    front_shiny: "url-shiny",
    front_shiny_female: null,
  },
  types: [{ type: { name: "fire" } }],
  stats: [
    { base_stat: 39 },
    { base_stat: 52 },
    { base_stat: 43 },
    { base_stat: 60 },
    { base_stat: 50 },
    { base_stat: 65 },
  ],
};

const fakeTypeListing = {
  pokemon: [{ pokemon: { name: "charmander" } }],
};

describe("/poke", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockImplementation((async (url: any) => {
      const stringUrl = url.toString();
      if (stringUrl.includes("/type/")) {
        return new Response(JSON.stringify(fakeTypeListing), { status: 200 });
      }
      return new Response(JSON.stringify(fakePokemon), { status: 200 });
    }) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("types subcommand", () => {
    it("replies with the static list of types — no fetch needed", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [subCommandArg("types")]);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.embeds).toHaveLength(1);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("random subcommand", () => {
    it("defers, fetches a pokemon, and replies via editReply", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [subCommandArg("random")]);

      expect(interaction.deferReply).toHaveBeenCalledOnce();
      expect(global.fetch).toHaveBeenCalledOnce();
      expect(interaction.editReply).toHaveBeenCalledOnce();
    });
  });

  describe("type subcommand", () => {
    it("with a valid type, fetches both the type list and a pokemon", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("type", [{ name: "name", value: "fire" }]),
      ]);

      expect(interaction.deferReply).toHaveBeenCalledOnce();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(interaction.editReply).toHaveBeenCalledOnce();
    });

    it("rejects ephemerally with an unknown type and skips fetching", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("type", [{ name: "name", value: "lava" }]),
      ]);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.ephemeral).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

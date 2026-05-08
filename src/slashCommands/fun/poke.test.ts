import { MessageFlags } from "discord.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMockClient,
  createMockInteraction,
  subCommandArg,
} from "../../test-utils/discord-mocks";
import poke from "./poke";

const fakePokemon = {
  name: "charmander",
  order: 4,
  sprites: {
    front_default: "https://example.com/charmander.png",
    front_female: null,
    front_shiny: "https://example.com/charmander-shiny.png",
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

const okFetch = (async (url: any) => {
  const stringUrl = url.toString();
  if (stringUrl.includes("/type/")) {
    return new Response(JSON.stringify(fakeTypeListing), { status: 200 });
  }
  return new Response(JSON.stringify(fakePokemon), { status: 200 });
}) as any;

describe("/poke", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockImplementation(okFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("types subcommand", () => {
    it("replies with the static list of types — no fetch needed", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("types"),
      ]);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.embeds).toHaveLength(1);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("becomes ephemeral when private:true", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("types", [{ name: "private", value: true }]),
      ]);
      const payload = interaction.reply.mock.calls[0][0];
      expect(payload.flags).toBe(MessageFlags.Ephemeral);
    });
  });

  describe("random subcommand", () => {
    it("defers, fetches a pokemon, and replies via editReply", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("random"),
      ]);

      expect(interaction.deferReply).toHaveBeenCalledOnce();
      expect(global.fetch).toHaveBeenCalledOnce();
      expect(interaction.editReply).toHaveBeenCalledOnce();
    });

    it("defers ephemerally when private:true", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("random", [{ name: "private", value: true }]),
      ]);
      const deferPayload = interaction.deferReply.mock.calls[0][0];
      expect(deferPayload.flags).toBe(MessageFlags.Ephemeral);
    });

    it("falls back to a friendly error message when fetch fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response("oops", { status: 500 })
      );
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("random"),
      ]);

      const payload = interaction.editReply.mock.calls[0][0];
      expect(payload.content).toContain("PokéAPI");
      // No flags here on purpose — editReply can't change ephemerality after defer
      expect(payload.flags).toBeUndefined();
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
      expect(payload.flags).toBe(MessageFlags.Ephemeral);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("falls back to a friendly error when the type listing endpoint fails", async () => {
      vi.spyOn(global, "fetch").mockImplementation((async (url: any) => {
        if (url.toString().includes("/type/")) {
          return new Response("oops", { status: 500 });
        }
        return new Response(JSON.stringify(fakePokemon), { status: 200 });
      }) as any);

      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("type", [{ name: "name", value: "fire" }]),
      ]);

      const payload = interaction.editReply.mock.calls[0][0];
      expect(payload.content).toContain("PokéAPI");
    });
  });

  describe("branding", () => {
    it("fire-type Pokémon embed uses fire color and brand footer (no setAuthor)", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("random"),
      ]);

      const payload = interaction.editReply.mock.calls[0][0];
      const embed = payload.embeds[0].data;
      expect(embed.color).toBe(0xee8130); // fire color
      expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
      expect(embed.author).toBeUndefined();
    });

    it("title is prefixed with 🔴", async () => {
      const interaction = createMockInteraction();
      await poke.run(createMockClient(), interaction, [
        subCommandArg("random"),
      ]);
      const embed = interaction.editReply.mock.calls[0][0].embeds[0].data;
      expect(embed.title).toMatch(/^🔴 /);
    });
  });

  describe("autocomplete", () => {
    const buildAutocompleteInteraction = (focusedValue: string) =>
      ({
        options: {
          getFocused: vi
            .fn()
            .mockReturnValue({ name: "name", value: focusedValue }),
        },
        respond: vi.fn().mockResolvedValue(undefined),
      }) as any;

    it("returns matching types as choices (substring)", async () => {
      const interaction = buildAutocompleteInteraction("fi");
      await poke.autocomplete!(createMockClient(), interaction);

      expect(interaction.respond).toHaveBeenCalledOnce();
      const choices = interaction.respond.mock.calls[0][0];
      const values = choices.map((c: any) => c.value);
      expect(values).toContain("fire");
      expect(values).toContain("fighting");
      expect(values).not.toContain("water");
    });

    it("returns the full list when query is empty", async () => {
      const interaction = buildAutocompleteInteraction("");
      await poke.autocomplete!(createMockClient(), interaction);
      const choices = interaction.respond.mock.calls[0][0];
      expect(choices.length).toBe(18);
    });
  });
});

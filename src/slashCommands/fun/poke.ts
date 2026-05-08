import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
} from "../../shared/constants/branding";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler, random } from "../../shared/utils/helpers";

const POKE_TYPES = [
  "bug",
  "dark",
  "dragon",
  "electric",
  "fairy",
  "fighting",
  "fire",
  "flying",
  "ghost",
  "grass",
  "ground",
  "ice",
  "normal",
  "poison",
  "psychic",
  "rock",
  "steel",
  "water",
] as const;

type PokeType = (typeof POKE_TYPES)[number];

/**
 * Canonical Pokémon type colors. Signal-carrying — convention bends as in /imc.
 * Multi-type pokémon use the FIRST type's color (Bulbasaur is grass, not poison).
 */
const TYPE_COLOR: Record<PokeType, number> = {
  bug: 0xa6b91a,
  dark: 0x705746,
  dragon: 0x6f35fc,
  electric: 0xf7d02c,
  fairy: 0xd685ad,
  fighting: 0xc22e28,
  fire: 0xee8130,
  flying: 0xa98ff3,
  ghost: 0x735797,
  grass: 0x7ac74c,
  ground: 0xe2bf65,
  ice: 0x96d9d6,
  normal: 0xa8a77a,
  poison: 0xa33ea1,
  psychic: 0xf95587,
  rock: 0xb6a136,
  steel: 0xb7b7ce,
  water: 0x6390f0,
};

const DEFAULT_POKE_COLOR = 0xa8a77a; // normal-type fallback

const SUB = {
  random: "random",
  types: "types",
  type: "type",
} as const;

const OPT = {
  name: "name",
  private: "private",
} as const;

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const MAX_POKE_ID = 898; // Gen 1–8. Don't bump without verifying API coverage.

const capitalizeFirst = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);

const isPokeType = (s: string): s is PokeType =>
  (POKE_TYPES as readonly string[]).includes(s);

const colorForFirstType = (data: any): number => {
  const firstType = (data.types?.[0]?.type?.name as string | undefined) ?? "";
  return isPokeType(firstType) ? TYPE_COLOR[firstType] : DEFAULT_POKE_COLOR;
};

const pickSprite = (data: any): { url: string; isShiny: boolean } => {
  const sprites = [
    data.sprites.front_default,
    data.sprites.front_female,
    data.sprites.front_shiny,
    data.sprites.front_shiny_female,
  ];
  // 1-in-50 chance to pick from any of the four sprites (incl. shinies);
  // otherwise default to one of the first two.
  let img =
    random(0, 49) === 1
      ? sprites[random(0, sprites.length - 1)]
      : sprites[random(0, 1)];
  img ??= data.sprites.front_default;
  return {
    url: img,
    isShiny: img === sprites[2] || img === sprites[3],
  };
};

const buildPokemonEmbed = (data: any, idOrName: number | string) => {
  const { url: img, isShiny } = pickSprite(data);
  const types = (data.types as any[])
    .map((t) => `\`${capitalizeFirst(t.type.name)}\``)
    .join(" ");
  const stats = data.stats as any[];
  const order =
    typeof idOrName === "number" || !data.order || data.order < 1
      ? idOrName.toString()
      : data.order;

  return new EmbedBuilder()
    .setTitle(
      `🔴 ${capitalizeFirst(data.name)}${isShiny ? " ⭐️" : ""} #${order}`
    )
    .setDescription(types)
    .setColor(colorForFirstType(data))
    .addFields(
      { name: "HP", value: `\`${stats[0].base_stat}\``, inline: true },
      { name: "Attack", value: `\`${stats[1].base_stat}\``, inline: true },
      { name: "Defense", value: `\`${stats[2].base_stat}\``, inline: true },
      { name: "Speed", value: `\`${stats[5].base_stat}\``, inline: true },
      { name: "Sp. Atk", value: `\`${stats[3].base_stat}\``, inline: true },
      { name: "Sp. Def", value: `\`${stats[4].base_stat}\``, inline: true }
    )
    .setImage(img)
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const buildTypesListEmbed = () =>
  new EmbedBuilder()
    .setTitle("🔴 Tipos disponibles")
    .setDescription(POKE_TYPES.map((t) => `\`${t}\``).join(" "))
    .setColor(DEFAULT_POKE_COLOR)
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const fetchJson = async (url: string): Promise<any | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// Note: no `flags` field — editReply can't change ephemerality after defer.
// The error inherits the visibility chosen at deferReply time.
const apiErrorPayload = () => ({
  content: "La PokéAPI no respondió bien. Intentá de nuevo en un rato.",
});

type SubArg = NonNullable<Argument["args"]>[number];

const findArg = (args: SubArg[] | undefined, name: string) =>
  args?.find((a) => a.name === name)?.value;

const pull: ISlashCommand = {
  name: "poke",
  category: "fun",
  description: "Genera un Pokémon",
  ownerOnly: false,
  options: [
    {
      name: SUB.random,
      description: "Pokémon completamente random (1-898)",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.private,
          description: "Mostrar la respuesta solo a vos (default: público)",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
    {
      name: SUB.types,
      description: "Lista los tipos disponibles",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.private,
          description: "Mostrar la respuesta solo a vos (default: público)",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
    {
      name: SUB.type,
      description: "Pokémon random de un tipo específico",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.name,
          description: "Tipo (fire, water, grass, etc.)",
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
        {
          name: OPT.private,
          description: "Mostrar la respuesta solo a vos (default: público)",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
  ],
  examples: [
    "/poke random",
    "/poke types",
    "/poke type name:fire",
    "/poke type name:water private:true",
  ],
  autocomplete: async (
    _: ClientDiscord,
    interaction: AutocompleteInteraction
  ) => {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== OPT.name) {
      await interaction.respond([]);
      return;
    }
    const query = String(focused.value ?? "").toLowerCase();
    const matches = POKE_TYPES.filter((t) => t.includes(query))
      .slice(0, 25)
      .map((t) => ({ name: capitalizeFirst(t), value: t }));
    await interaction.respond(matches);
  },
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const sub = args[0];
      if (!sub) return;
      const subArgs = sub.args ?? [];
      const isPrivate =
        (findArg(subArgs, OPT.private) as boolean | undefined) ?? false;
      const flags = isPrivate ? MessageFlags.Ephemeral : undefined;

      if (sub.name === SUB.types) {
        return interaction.reply({
          embeds: [buildTypesListEmbed()],
          flags,
        });
      }

      if (sub.name === SUB.type) {
        const typeName = (findArg(subArgs, OPT.name) as string) ?? "";
        if (!isPokeType(typeName)) {
          return interaction.reply({
            content: `Tipo no encontrado. Prueba con: ${POKE_TYPES.join(", ")}`,
            flags: MessageFlags.Ephemeral,
          });
        }

        await interaction.deferReply({ flags });
        const typeData = await fetchJson(`${POKEAPI_BASE}/type/${typeName}`);
        if (!typeData?.pokemon?.length) {
          return interaction.editReply(apiErrorPayload());
        }
        const picked =
          typeData.pokemon[random(0, typeData.pokemon.length - 1)].pokemon.name;
        const pokeData = await fetchJson(`${POKEAPI_BASE}/pokemon/${picked}`);
        if (!pokeData) return interaction.editReply(apiErrorPayload());
        return interaction.editReply({
          embeds: [buildPokemonEmbed(pokeData, picked)],
        });
      }

      // SUB.random (default fallthrough)
      await interaction.deferReply({ flags });
      const id = random(1, MAX_POKE_ID);
      const data = await fetchJson(`${POKEAPI_BASE}/pokemon/${id}`);
      if (!data) return interaction.editReply(apiErrorPayload());
      return interaction.editReply({
        embeds: [buildPokemonEmbed(data, id)],
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

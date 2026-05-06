import { ChatInputCommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
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

const SUB = {
  random: "random",
  types: "types",
  type: "type",
} as const;

const pull: ISlashCommand = {
  name: "poke",
  category: "fun",
  description: "Genera un Pokémon",
  ownerOnly: false,
  options: [
    {
      name: SUB.random,
      description: "Pokémon completamente random (1-898)",
      type: MoreCommandTypes.SUB_COMMAND,
    },
    {
      name: SUB.types,
      description: "Lista los tipos disponibles",
      type: MoreCommandTypes.SUB_COMMAND,
    },
    {
      name: SUB.type,
      description: "Pokémon random de un tipo específico",
      type: MoreCommandTypes.SUB_COMMAND,
      options: [
        {
          name: "name",
          description: "Tipo (fire, water, grass, etc.)",
          type: MoreCommandTypes.STRING,
          required: true,
        },
      ],
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const sub = args[0];
      if (!sub) return;

      if (sub.name === SUB.types) {
        const list = POKE_TYPES.map((t) => `\`${t}\``).join(" ");
        return interaction.reply({
          embeds: [
            { color: 0x0099ff, title: "Tipos disponibles", description: list },
          ],
        });
      }

      if (sub.name === SUB.type) {
        const typeName = sub.args?.[0].value as string;
        if (!POKE_TYPES.includes(typeName as (typeof POKE_TYPES)[number])) {
          return interaction.reply({
            content: `Tipo no encontrado. Probá con: ${POKE_TYPES.join(", ")}`,
            ephemeral: true,
          });
        }
        await interaction.deferReply();
        const typeRes = await fetch(
          `https://pokeapi.co/api/v2/type/${typeName}`
        );
        const typeData: any = await typeRes.json();
        const picked =
          typeData.pokemon[random(0, typeData.pokemon.length - 1)].pokemon.name;
        const pokeRes = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${picked}`
        );
        const pokeData: any = await pokeRes.json();
        return interaction.editReply(buildEmbed(pokeData, picked));
      }

      // SUB.random (default)
      await interaction.deferReply();
      const id = random(1, 898);
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data: any = await res.json();
      return interaction.editReply(buildEmbed(data, id));
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

const capitalizeFirst = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);

const buildEmbed = (data: any, idOrName: number | string) => {
  const sprites = [
    data.sprites.front_default,
    data.sprites.front_female,
    data.sprites.front_shiny,
    data.sprites.front_shiny_female,
  ];

  let img =
    random(0, 49) === 1
      ? sprites[random(0, sprites.length - 1)]
      : sprites[random(0, 1)];
  img ??= data.sprites.front_default;
  const isShiny = img === sprites[2] || img === sprites[3];

  const types = (data.types as any[])
    .map((t) => `\`${capitalizeFirst(t.type.name)}\``)
    .join(" ");

  const stats = data.stats as any[];
  const order =
    typeof idOrName === "number" || !data.order || data.order < 1
      ? idOrName.toString()
      : data.order;

  return {
    embeds: [
      {
        color: 0x0099ff,
        title: `${capitalizeFirst(data.name)}${isShiny ? " ⭐️" : ""} #${order}`,
        description: types,
        fields: [
          { name: "HP", value: `\`${stats[0].base_stat}\``, inline: true },
          { name: "Attack", value: `\`${stats[1].base_stat}\``, inline: true },
          { name: "Defense", value: `\`${stats[2].base_stat}\``, inline: true },
          { name: "Speed", value: `\`${stats[5].base_stat}\``, inline: true },
          { name: "Sp. Atk", value: `\`${stats[3].base_stat}\``, inline: true },
          { name: "Sp. Def", value: `\`${stats[4].base_stat}\``, inline: true },
        ],
        image: { url: img },
      },
    ],
  };
};

export default pull;

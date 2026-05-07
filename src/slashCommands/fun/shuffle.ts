import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  colorForCategory,
} from "../../shared/constants/branding";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler, shuffle } from "../../shared/utils/helpers";

const SUB = {
  words: "words",
  numbers: "numbers",
} as const;

const OPT = {
  list: "list",
  winners: "winners",
  quantity: "quantity",
  private: "private",
} as const;

const MIN_ITEMS = 2;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 50;

/**
 * Splits the raw list on commas, semicolons, or any whitespace, trims each
 * item and drops empties. Supports `"ana bob carla"`, `"ana,bob,carla"`,
 * `"ana, bob, carla"`, etc. — whichever feels natural to the user.
 */
const parseWordList = (raw: string): string[] =>
  raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const enumerateLines = (items: (string | number)[]) =>
  items.map((item, i) => `**${i + 1}.** ${item}`).join("\n");

const buildBaseEmbed = (title: string, description: string) =>
  new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(colorForCategory("fun"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

type Result = { embed?: EmbedBuilder; error?: string };

const handleWords = (rawList: string, winners: number | undefined): Result => {
  const list = parseWordList(rawList);
  if (list.length < MIN_ITEMS) {
    return {
      error: `Necesito al menos ${MIN_ITEMS} elementos. Separá la lista con espacios, comas o punto y coma.`,
    };
  }
  if (winners !== undefined && winners < 1) {
    return { error: "El número de ganadores debe ser al menos 1." };
  }

  const shuffled = shuffle(list);
  const cap =
    winners !== undefined ? Math.min(winners, list.length) : list.length;
  const picked = shuffled.slice(0, cap);

  let title: string;
  if (winners !== undefined) {
    title = cap === 1 ? "🏆 Ganador" : `🏆 Ganadores (${cap})`;
  } else {
    title = "🔀 Lista aleatoria";
  }

  const embed = buildBaseEmbed(title, enumerateLines(picked)).addFields({
    name: "Lista original",
    value: list.join(", "),
  });

  return { embed };
};

const handleNumbers = (rawQuantity: number | undefined): Result => {
  if (rawQuantity === undefined) {
    return { error: "Tenés que pasar la cantidad." };
  }
  if (rawQuantity < MIN_QUANTITY) {
    return { error: `La cantidad debe ser al menos ${MIN_QUANTITY}.` };
  }

  const quantity = Math.min(rawQuantity, MAX_QUANTITY);
  const list = Array.from({ length: quantity }, (_, i) => i + 1);
  const shuffled = shuffle(list);

  const embed = buildBaseEmbed(
    `🔀 Números (1–${quantity})`,
    shuffled.join(", ")
  );

  return { embed };
};

const pull: ISlashCommand = {
  name: "shuffle",
  category: "fun",
  description: "Mezcla aleatoriamente una lista de palabras o números",
  ownerOnly: false,
  options: [
    {
      name: SUB.words,
      description: "Mezcla una lista de palabras",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.list,
          description: "Lista separada por espacios, comas o punto y coma",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: OPT.winners,
          description:
            "Cantidad de ganadores a elegir (default: toda la lista)",
          type: ApplicationCommandOptionType.Integer,
          required: false,
        },
        {
          name: OPT.private,
          description: "Mostrar la respuesta solo a vos (default: público)",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
    {
      name: SUB.numbers,
      description: "Genera y mezcla los números del 1 al N",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.quantity,
          description: `Cantidad de números (${MIN_QUANTITY}–${MAX_QUANTITY})`,
          type: ApplicationCommandOptionType.Integer,
          required: true,
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
    "/shuffle words list:ana,bob,carla",
    "/shuffle words list:ana bob carla winners:1",
    "/shuffle numbers quantity:10",
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const sub = args[0];
      if (!sub) return;

      const subArgs = sub.args ?? [];
      const findArg = (name: string) =>
        subArgs.find((a) => a.name === name)?.value;
      const isPrivate = (findArg(OPT.private) as boolean | undefined) ?? false;

      let result: Result;
      if (sub.name === SUB.words) {
        const rawList = (findArg(OPT.list) as string) ?? "";
        const winners = findArg(OPT.winners) as number | undefined;
        result = handleWords(rawList, winners);
      } else if (sub.name === SUB.numbers) {
        const quantity = findArg(OPT.quantity) as number | undefined;
        result = handleNumbers(quantity);
      } else {
        return;
      }

      if (result.error) {
        return interaction.reply({
          content: result.error,
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        embeds: [result.embed!],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

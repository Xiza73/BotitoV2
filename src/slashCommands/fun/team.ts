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

const MIN_TEAMS = 2;
const MAX_TEAMS = 10;
const MIN_LIST_SIZE = 2;

/**
 * Splits a list into N teams via round-robin: shuffled list distributed one
 * item at a time. Yields balanced sizes (max diff of 1) regardless of total.
 */
const splitIntoTeams = <T>(items: T[], teams: number): T[][] => {
  const buckets: T[][] = Array.from({ length: teams }, () => []);
  items.forEach((item, i) => buckets[i % teams].push(item));
  return buckets;
};

const parseList = (raw: string): string[] =>
  raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const pull: ISlashCommand = {
  name: "team",
  category: "fun",
  description: "Divide una lista en N equipos balanceados",
  ownerOnly: false,
  options: [
    {
      name: "list",
      description: "Lista separada por espacios, comas o punto y coma",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "teams",
      description: `Cantidad de equipos (${MIN_TEAMS}–${MAX_TEAMS})`,
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/team list:ana bob carla diego eve frank teams:2",
    "/team list:ana,bob,carla,diego teams:2",
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const rawList = (args.find((a) => a.name === "list")?.value as string) ?? "";
      const teams = args.find((a) => a.name === "teams")?.value as number;
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      if (teams < MIN_TEAMS || teams > MAX_TEAMS) {
        return interaction.reply({
          content: `La cantidad de equipos debe estar entre ${MIN_TEAMS} y ${MAX_TEAMS}.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const list = parseList(rawList);
      if (list.length < MIN_LIST_SIZE) {
        return interaction.reply({
          content: `Necesito al menos ${MIN_LIST_SIZE} elementos. Separá la lista con espacios, comas o punto y coma.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (list.length < teams) {
        return interaction.reply({
          content: `No hay suficientes elementos (${list.length}) para armar ${teams} equipos.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const shuffled = shuffle(list);
      const buckets = splitIntoTeams(shuffled, teams);

      const fields = buckets.map((bucket, i) => ({
        name: `🏳️ Equipo ${i + 1} (${bucket.length})`,
        value: bucket.map((m, j) => `**${j + 1}.** ${m}`).join("\n"),
        inline: true,
      }));

      const embed = new EmbedBuilder()
        .setTitle("🧑‍🤝‍🧑 Equipos")
        .setDescription(
          `**${list.length}** ${list.length === 1 ? "persona" : "personas"} divididas en **${teams}** equipos.`
        )
        .setColor(colorForCategory("fun"))
        .addFields(fields)
        .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

      return interaction.reply({
        embeds: [embed],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

import {
  APIEmbedField,
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
import calendar from "../../shared/constants/calendar";
import {
  getBirthdays,
  getBirthdaysByMonth,
} from "../../shared/services/birthday.service";
import { Argument, CumData, ISlashCommand, Month } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const baseEmbed = (title: string) =>
  new EmbedBuilder()
    .setTitle(title)
    .setColor(colorForCategory("mod"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const buildBirthdaysEmbed = (response: CumData, monthName: string | null) => {
  const totalCount = Object.values(response).reduce(
    (sum, list) => sum + list.length,
    0
  );

  const fields: APIEmbedField[] = [];
  for (const month in response) {
    const users = response[month]
      .map((b: any) => ({ day: b.birthdayDay, mention: `<@${b.discordId}>` }))
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));

    fields.push({
      name: month,
      value: users.map((u) => `\`${u.day}\` ${u.mention}`).join("\n"),
      inline: true,
    });
  }

  const title = monthName
    ? `🎂 Cumpleaños de ${monthName}`
    : "🎂 Cumpleaños del servidor";
  const description = `**${totalCount}** ${
    totalCount === 1 ? "persona registrada" : "personas registradas"
  }`;

  return baseEmbed(title).setDescription(description).addFields(fields);
};

const buildEmptyMonthEmbed = (monthName: string) =>
  baseEmbed(`🎂 Sin cumpleaños en ${monthName}`).setDescription(
    "No hay cumpleaños registrados para este mes."
  );

const pull: ISlashCommand = {
  name: "cums",
  category: "mod",
  description: "Lista todos los cumpleaños del servidor",
  ownerOnly: false,
  options: [
    {
      name: "month",
      description: "Filtrar por mes (1-12)",
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/cums", "/cums month:5", "/cums private:true"],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const monthInput = args.find((a) => a.name === "month")?.value as
        | number
        | undefined;
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;
      const flags = isPrivate ? MessageFlags.Ephemeral : undefined;

      let response: CumData = {};
      let monthName: string | null = null;

      if (monthInput !== undefined) {
        if (monthInput < 1 || monthInput > 12) {
          return interaction.reply({
            content: "El mes debe estar entre 1 y 12.",
            flags: MessageFlags.Ephemeral,
          });
        }
        const monthIdx = (monthInput - 1) as Month;
        monthName = calendar.months[monthIdx];
        response = await getBirthdaysByMonth(monthIdx);
        if (Object.keys(response).length === 0) {
          return interaction.reply({
            embeds: [buildEmptyMonthEmbed(monthName)],
            flags,
          });
        }
      } else {
        response = await getBirthdays();
        if (Object.keys(response).length === 0) {
          return interaction.reply({
            embeds: [
              baseEmbed("🎂 Sin cumpleaños registrados").setDescription(
                "Todavía no hay nadie con cumpleaños registrado en el bot. Usa `/register` para empezar."
              ),
            ],
            flags,
          });
        }
      }

      return interaction.reply({
        embeds: [buildBirthdaysEmbed(response, monthName)],
        flags,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

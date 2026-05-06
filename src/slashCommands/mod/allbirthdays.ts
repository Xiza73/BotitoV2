import {
  APIEmbedField,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import calendar from "../../shared/constants/calendar";
import { Argument, CumData, ISlashCommand, Month } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";
import {
  getBirthdays,
  getBirthdaysByMonth,
} from "../../shared/services/birthday.service";

const pull: ISlashCommand = {
  name: "allbirthdays",
  category: "mod",
  description: "Lista todos los cumpleaños del servidor",
  ownerOnly: false,
  options: [
    {
      name: "month",
      description: "Filtrar por mes (1-12)",
      type: MoreCommandTypes.INTEGER,
      required: false,
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const monthInput = args.find((a) => a.name === "month")?.value as
        | number
        | undefined;

      let response: CumData = {};
      if (monthInput !== undefined) {
        const month = (monthInput - 1) as Month;
        if (month < 0 || month > 11) {
          return interaction.reply({
            content: "El mes debe estar entre 1 y 12",
            ephemeral: true,
          });
        }
        response = await getBirthdaysByMonth(month);
        if (Object.keys(response).length === 0) {
          return interaction.reply({
            content: `No hay cumpleaños en ${calendar.months[month]}`,
            ephemeral: true,
          });
        }
      } else {
        response = await getBirthdays();
      }

      const embed = new EmbedBuilder({
        title: "Cumpleaños 🎂",
        color: 0x00ff00,
      });

      const fields: APIEmbedField[] = [];
      for (const monthName in response) {
        const users = response[monthName].map(
          (b: any) => ` \`${b.birthdayDay}\` <@${b.discordId}>`
        );
        users.sort((a, b) => {
          const dayA = parseInt(a.split(" ")[1].replace("`", ""));
          const dayB = parseInt(b.split(" ")[1].replace("`", ""));
          return dayA - dayB;
        });
        fields.push({ name: monthName, value: users.join("\n"), inline: true });
      }
      embed.addFields(fields);

      return interaction.reply({
        embeds: [embed],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

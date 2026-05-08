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
import calendar from "../../shared/constants/calendar";
import { getNextBirthday } from "../../shared/services/birthday.service";
import {
  Argument,
  CumUser,
  ISlashCommand,
  Month,
} from "../../shared/types";
import { errorHandler, nextBirthdayDate } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "nextcum",
  category: "mod",
  description: "Muestra el próximo cumpleaños registrado",
  ownerOnly: false,
  options: [
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/nextcum", "/nextcum private:true"],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      const response: CumUser = await getNextBirthday();
      if (!response?.discordId) {
        return interaction.reply({
          content: "No hay cumpleaños próximos registrados.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const user = await client.users.fetch(response.discordId);
      const day = response.birthdayDay!;
      const monthIdx = (response.birthdayMonth! - 1) as Month;
      const monthName = calendar.months[monthIdx];
      const next = nextBirthdayDate(day, response.birthdayMonth!);
      const relativeSeconds = Math.floor(next.getTime() / 1000);

      const embed = new EmbedBuilder()
        .setTitle("🎂 Próximo cumple")
        .setThumbnail(user.avatarURL() ?? null)
        .setDescription(
          `**${response.name}** — <@${response.discordId}>`
        )
        .addFields(
          {
            name: "📅 Fecha",
            value: `\`${day} de ${monthName}\``,
            inline: true,
          },
          {
            name: "⏳ Faltan",
            value: `<t:${relativeSeconds}:R>`,
            inline: true,
          }
        )
        .setColor(colorForCategory("mod"))
        .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

      return interaction.reply({
        embeds: [embed],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

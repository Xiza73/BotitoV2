import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import calendar from "../../shared/constants/calendar";
import {
  Argument,
  CumUser,
  ISlashCommand,
  Month,
} from "../../shared/types";
import { errorHandler, mentionUser } from "../../shared/utils/helpers";
import { getNextBirthday } from "../../shared/services/birthday.service";

const pull: ISlashCommand = {
  name: "nextcum",
  category: "mod",
  description: "Próximo cumpleaños registrado",
  ownerOnly: false,
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    _: Argument[]
  ) => {
    try {
      const response: CumUser = await getNextBirthday();
      if (!response?.discordId) {
        return interaction.reply({
          content: "No hay cumpleaños próximos registrados.",
          ephemeral: true,
        });
      }

      const user = await client.users.fetch(response.discordId);

      const embed = new EmbedBuilder({
        title: "Próximo cumpleaños 🎂",
        color: 0x00ff00,
        description: mentionUser(response.discordId),
        thumbnail: { url: user.avatarURL() ?? "" },
      }).addFields([
        {
          name: "Día",
          value: `\`${response.birthdayDay!.toString()}\``,
          inline: true,
        },
        {
          name: "Mes",
          value: `\`${calendar.months[(response.birthdayMonth! - 1) as Month]}\``,
          inline: true,
        },
      ]);

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

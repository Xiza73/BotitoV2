import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import calendar from "../../shared/constants/calendar";
import { Argument, ISlashCommand, Month } from "../../shared/types";
import { errorHandler, mentionUser } from "../../shared/utils/helpers";
import {
  getUserById,
  getUserByName,
} from "../../shared/services/user.service";

const pull: ISlashCommand = {
  name: "readmember",
  category: "mod",
  description: "Leer datos de un miembro de Gmi2",
  ownerOnly: false,
  options: [
    {
      name: "user",
      description: "Buscar por usuario de Discord",
      type: MoreCommandTypes.USER,
      required: false,
    },
    {
      name: "name",
      description: "Buscar por nombre real",
      type: MoreCommandTypes.STRING,
      required: false,
    },
  ],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const userId = args.find((a) => a.name === "user")?.value as
        | string
        | undefined;
      const name = args.find((a) => a.name === "name")?.value as
        | string
        | undefined;

      let res;
      let userIdToFetch: string;

      if (userId) {
        res = await getUserById(userId);
        userIdToFetch = res.discordId;
      } else if (name) {
        res = await getUserByName(name);
        userIdToFetch = res.discordId;
      } else {
        res = await getUserById(interaction.user.id);
        userIdToFetch = res.discordId;
      }

      if (!res) throw new Error("No se encontró usuario");

      const user = await client.users.fetch(userIdToFetch);

      const embed = new EmbedBuilder({
        title: "CUMpleaños 🎂",
        thumbnail: { url: user.avatarURL() ?? "" },
        description: mentionUser(res.discordId),
        fields: [
          {
            name: " ",
            value: `\`${res.birthdayDay} de ${
              calendar.months[(parseInt(res.birthdayMonth) - 1) as Month]
            }\``,
          },
        ],
      }).setColor("Random");

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

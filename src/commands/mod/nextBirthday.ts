import { Client, EmbedBuilder, Message } from "discord.js";
import { CumData, CumUser, ICommand, Month } from "../../shared/types";
import _config from "../../config";
import { getNextBirthday } from "../../shared/services/birthday.service";
import calendar from "../../shared/constants/calendar";
import { mentionUser } from "../../shared/utils/helpers";

const pull: ICommand = {
  name: "nextbirthday",
  category: null,
  description: "Obtener todos los cumpleaños",
  usage: "",
  aliases: ["nextb", "nextbirth", "nextcum"],
  ownerOnly: false,
  run: async (client: Client, msg: Message<true>, __: string[], _: string) => {
    try {
      const response: CumUser = await getNextBirthday();
      const user = await client.users.fetch(response.discordId);

      const embed = new EmbedBuilder({
        title: "Próximo cumpleaños 🎂",
        color: 0x00ff00,
        description: mentionUser(response.discordId),
        thumbnail: {
          url: user.avatarURL() ?? "",
        },
      });

      embed.addFields([
        {
          name: "Día",
          value: `\`${response.birthdayDay!.toString()}\``,
          inline: true,
        },
        {
          name: "Mes",
          value: `\`${
            calendar.months[(response.birthdayMonth! - 1) as Month]
          }\``,
          inline: true,
        },
      ]);

      msg.channel.send({
        embeds: [embed],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      msg.channel.send({
        content: "Ha ocurrido un error",
      });
    }
  },
};

export default pull;

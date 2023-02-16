import { Client, MessageEmbed, Message, User } from "discord.js";
import { ICommand, Month } from "../../shared/types";
import _config from "../../config";
import calendar from "../../shared/constants/calendar";
import { getUserById, getUserByName } from "../../shared/services/user.service";
import { errorHandler, mentionUser } from "../../shared/utils/helpers";

const apiUrl = _config.api;

const pull: ICommand = {
  name: "readmember",
  category: null,
  description: "Leer datos de usuario",
  usage: "<param>",
  aliases: ["whois", "wi", "read"],
  ownerOnly: false,
  run: async (client: Client, msg: Message, args: string[], _: string) => {
    let res;
    let user: User;
    try {
      const mentions = msg.mentions.users.map((x) => x.id);
      if (!mentions || mentions.length === 0) {
        res = args[0]
          ? await getUserByName(args[0])
          : await getUserById(msg.author.id);
        user = await client.users.fetch(res.discordId);
      } else {
        user = await client.users.fetch(mentions[0]);
        res = await getUserById(user.id);
      }
      if (!user || !res) throw new Error("No se encontró usuario");

      const embed = new MessageEmbed({
        title: "CUMpleaños 🎂",
        thumbnail: {
          url: user.avatarURL()!,
        },
        description: mentionUser(res.discordId),
        fields: [
          {
            name: " ",
            value: `\`${res.birthdayDay} de ${
              calendar.months[(parseInt(res.birthdayMonth) - 1) as Month]
            }\``,
          },
        ],
      }).setColor("RANDOM");

      msg.channel.send({ embeds: [embed] });
      return;
    } catch (error: any) {
      errorHandler(msg, error);
    }
  },
};

export default pull;

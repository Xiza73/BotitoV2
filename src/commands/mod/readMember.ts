import { Client, EmbedBuilder, Message, User } from "discord.js";
import { ICommand, Param } from "../../shared/types/types";
import _config from "../../config";
import fetch from "cross-fetch";
import { month, setParams } from "../../shared/utils/helpers";

const apiUrl = _config.api;

const pull: ICommand = {
  name: "readmember",
  category: null,
  description: "Leer datos de usuario",
  usage: "<param>",
  aliases: ["whois", "wi", "read"],
  ownerOnly: false,
  run: async (client: Client, msg: Message, args: string[], _: string) => {
    if (!args[0]) {
      msg.channel.send("Falta agregar un nombre");
      return;
    }
    let res;
    let user: User;
    try {
      const mentions = msg.mentions.users.map((x) => x.id);
      if (!mentions || mentions.length === 0) {
        const params: Param[] = [
          {
            name: "name",
            value: args[0],
          },
        ];
        const url = `${apiUrl}/api/user/name/${setParams(params)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        res = await response.json();
        user = await client.users.fetch(res.data.discordId);
      } else {
        user = await client.users.fetch(mentions[0]);
        const params: Param[] = [
          {
            name: "discordId",
            value: user.id,
          },
        ];
        const response = await fetch(
          `${apiUrl}/api/user/discordId/${setParams(params)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        res = await response.json();
      }
      if (res.statusCode !== 200) return msg.channel.send(`${res.message}`);

      const embed = new EmbedBuilder({
        title: "Información de usuario",
        author: {
          name: user.username,
          icon_url: user.avatarURL()!,
        },
        thumbnail: {
          url: user.avatarURL()!,
        },
        fields: [
          {
            name: "CUMpleaños",
            value: `${res.data.birthdayDay} de ${
              month[parseInt(res.data.birthdayMonth) - 1]
            }`,
          },
        ],
      }).setColor("Random");

      msg.channel.send({ embeds: [embed] });
      return;
    } catch (error) {
      msg.channel.send(`Error al obtener usuario: ${error}`);
    }
  },
};

export default pull;

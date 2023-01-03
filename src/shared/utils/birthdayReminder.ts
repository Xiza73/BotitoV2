import _config from "../../config";
import ClientDiscord from "../classes/ClientDiscord";
import fetch from "cross-fetch";
import { channelSender, dateToUTC5 } from "./helpers";
import { MessageEmbed } from "discord.js";

const apiUrl = _config.api;

export const reminder = async (client: ClientDiscord) => {
  try {
    const today = dateToUTC5(new Date());

    let res: any = await fetch(`${apiUrl}/api/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    res = await res.json();
    if (res.statusCode !== 200) return;

    const users: any = res.data;

    users.forEach(async (e: any) => {
      if (today.day === e.birthdayDay && today.month === e.birthdayMonth) {
        const user = await client.users.fetch(e.discordId);
        const embed = new MessageEmbed()
          .setColor("RANDOM")
          .setTitle("GangBang al CUMpleañero! 🥳🎂🎉")
          .setDescription(`👑 Felicitaciones **<@${user.id}>**`)
          .setThumbnail(
            user.avatarURL({
              size: 64,
            })!
          )
          .setImage(
            "https://i.pinimg.com/736x/f8/28/57/f82857d4da012fba311ea8040e163d5e.jpg"
          )
          .setTimestamp(new Date());

        channelSender(client, _config.gmi2Channel, {
          embeds: [embed],
          allowedMentions: { repliedUser: true },
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

import _config from "../../config";
import ClientDiscord from "../classes/ClientDiscord";
import * as userDao from "../../api/dao/user.dao";
import { ResponseData } from "../../handlers/ResponseData";
import { channelSender, dateToUTC5 } from "./helpers";
import { EmbedBuilder } from "discord.js";

export const reminder = async (client: ClientDiscord) => {
  try {
    const today = dateToUTC5(new Date());

    const res = await userDao.readUsers();
    if (res.statusCode !== 200) return;

    const users: any = (res as ResponseData).data;

    users.forEach(async (e: any) => {
      if (today.day === e.birthdayDay && today.month === e.birthdayMonth) {
        const user = await client.users.fetch(e.discordId);
        const embed = new EmbedBuilder()
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
  } catch (error) {}
};

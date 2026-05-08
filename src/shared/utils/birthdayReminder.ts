import { EmbedBuilder, User } from "discord.js";

import _config from "../../config";
import * as userDao from "../../api/dao/user.dao";
import { ResponseData } from "../../handlers/ResponseData";
import ClientDiscord from "../classes/ClientDiscord";
import { channelSender, dateToUTC5 } from "./helpers";

/**
 * Builds the birthday-greeting embed used by both the daily cron and the
 * /cum slash command. Single source of truth so the two paths can never
 * drift visually.
 */
export const buildBirthdayGreetingEmbed = (user: User): EmbedBuilder =>
  new EmbedBuilder()
    .setColor("Random")
    .setTitle("GangBang al CUMpleañero! 🥳🎂🎉")
    .setDescription(`👑 Felicitaciones **<@${user.id}>**`)
    .setThumbnail(user.avatarURL({ size: 64 }) ?? null)
    .setImage(
      "https://i.pinimg.com/736x/f8/28/57/f82857d4da012fba311ea8040e163d5e.jpg"
    )
    .setTimestamp(new Date());

/**
 * Walks the registered users, fires the greeting for everyone whose birthday
 * matches today's date in UTC-5. Returns the number of greetings sent so the
 * caller (the cron, or the /cum slash command) can report it.
 */
export const reminder = async (
  client: ClientDiscord
): Promise<{ count: number }> => {
  let count = 0;
  try {
    const today = dateToUTC5(new Date());

    const res = await userDao.readUsers();
    if (res.statusCode !== 200) return { count: 0 };

    const users: any = (res as ResponseData).data;

    for (const e of users) {
      if (today.day !== e.birthdayDay || today.month !== e.birthdayMonth) {
        continue;
      }
      const user = await client.users.fetch(e.discordId);
      channelSender(client, _config.gmi2Channel, {
        embeds: [buildBirthdayGreetingEmbed(user)],
        allowedMentions: { repliedUser: true },
      });
      count++;
    }
  } catch {
    // best-effort cron — don't blow up the daily run
  }
  return { count };
};

import { EmbedBuilder, User } from "discord.js";

import _config from "../../config";
import * as userDao from "../../api/dao/user.dao";
import { ResponseData } from "../../handlers/ResponseData";
import ClientDiscord from "../classes/ClientDiscord";
import { getNewDate } from "./dayjs";
import { channelSender, logger } from "./helpers";

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
 * Greets every user with greetings enabled whose birthday is today in Lima.
 * Returns the number of greetings sent so the caller (the cron, or the /cum
 * slash command) can report it.
 */
export const reminder = async (
  client: ClientDiscord
): Promise<{ count: number }> => {
  const today = getNewDate("lima");
  const res = await userDao.readBirthdayUsers(today.date(), today.month() + 1);
  if (res.statusCode !== 200) return { count: 0 };

  let count = 0;
  for (const e of (res as ResponseData).data) {
    // One failing user (left the server, deleted account) must not cost the
    // rest of today's birthdays their greeting.
    try {
      const user = await client.users.fetch(e.discordId);
      const sent = await channelSender(client, _config.gmi2Channel, {
        embeds: [buildBirthdayGreetingEmbed(user)],
        allowedMentions: { repliedUser: true },
      });
      if (sent) count++;
    } catch (err) {
      logger(`[CRON] birthday greeting failed for ${e.discordId}`, err);
    }
  }
  return { count };
};

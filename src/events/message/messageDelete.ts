import { EmbedBuilder, Message } from "discord.js";

import config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
} from "../../shared/constants/branding";

const DELETE_COLOR = 0xed4245; // mod red — signal of removal
const MAX_DESCRIPTION = 4000;

export default {
  name: "messageDelete",
  type: "message",
  /**
   * Fires for individual message deletions. discord.js emits this event for
   * every cached message in a bulkDelete too, so /clear's recap code skips
   * the single-text-only case to avoid duplicating what this listener already
   * sends.
   */
  async execute(message: Message, client: ClientDiscord) {
    if (message?.author?.bot) return;

    const attachmentUrl = message?.attachments?.at(0)?.url;
    if (!message?.content && !attachmentUrl) return;
    if (message?.channel?.id !== config.gmi2Channel) return;

    const trimmedContent = message.content
      ? message.content.slice(0, MAX_DESCRIPTION) +
        (message.content.length > MAX_DESCRIPTION ? "…" : "")
      : "";

    const owner = await client.users.fetch(config.ownerId, { cache: false });

    // Layout choice: no title up top so the embed reads like the original
    // message preserved (avatar + name + content + timestamp). The 'deleted'
    // hint goes in the footer alongside the brand, so the visual illusion of
    // 'this is the message' isn't broken at first glance.
    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.author.username || message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setColor(DELETE_COLOR)
      .setTimestamp(message.createdTimestamp ?? new Date())
      .setFooter({ text: `🗑️ Eliminado · ${BOT_BRAND_NAME} ${BOT_VERSION}` });

    if (trimmedContent) embed.setDescription(trimmedContent);

    // Re-upload the attachment as a fresh file (not just the URL) so it
    // survives Discord dropping the deleted-message CDN URL.
    if (attachmentUrl) {
      await owner.send({ embeds: [embed], files: [attachmentUrl] });
      return;
    }

    await owner.send({ embeds: [embed] });
  },
};

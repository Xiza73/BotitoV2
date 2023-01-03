import { MessageEmbed, Message } from "discord.js";
import config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";

module.exports = {
  name: "messageDelete",
  type: "message",
  // just work on the first message update, and just in gmi2 channel
  async execute(message: Message, client: ClientDiscord) {
    if (message?.author?.bot) return;

    if (!message?.content && !message?.attachments?.at(0)?.url) return;

    if (message?.channel?.id !== config.gmi2Channel) return;

    const count = 4096;

    const deletedMesaage =
      message.content?.slice(0, count) +
      (message.content?.length > count ? "..." : "") +
      (message.attachments?.at(0)?.url &&
        `\n${message.attachments?.at(0)?.url}`);

    const log = new MessageEmbed({
      author: {
        name: message.author.username || message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      },
      description: deletedMesaage,
      timestamp: new Date(),
      ...(message.attachments?.at(0)?.url && {
        image: {
          url: message.attachments?.at(0)?.url,
        },
      }),
      color: "RED",
    });

    const user = await client.users.fetch(config.ownerId, {
      cache: false,
    });

    await user.send({ embeds: [log] });
  },
};

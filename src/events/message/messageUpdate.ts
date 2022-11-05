import { MessageEmbed, Message } from "discord.js";
import config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";

module.exports = {
  name: "messageUpdate",
  type: "message",
  // just work on the first message update, and just in gmi2 channel
  async execute(
    oldMessage: Message,
    newMessage: Message,
    client: ClientDiscord
  ) {
    if (oldMessage?.author?.bot) return;

    if (oldMessage?.content === newMessage?.content) return;

    if (!oldMessage?.content) return;

    if (oldMessage?.channel?.id !== config.gmi2Channel) return;

    const count = 1950;

    const original =
      oldMessage.content.slice(0, count) +
      (oldMessage.content.length > count ? "..." : "");
    const edited =
      newMessage.content.slice(0, count) +
      (newMessage.content.length > count ? "..." : "");

    const log = new MessageEmbed()
      .setAuthor({
        name: oldMessage.author.tag,
        iconURL: oldMessage.author.displayAvatarURL(),
      })
      .setDescription(
        `Message sent by ${oldMessage.author} **edited** in ${oldMessage.channel}`
      )
      .addFields(
        { name: "Original", value: original },
        { name: "Edited", value: edited }
      )
      .setTimestamp()
      .setColor("YELLOW");

    const user = await client.users.fetch(config.ownerId, {
      cache: false,
    });

    await user.send({ embeds: [log] });
  },
};

import { EmbedBuilder, Message } from "discord.js";

import config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";

const EDIT_COLOR = 0xfee75c; // yellow — signal of change (vs red for delete)
const MAX_DESCRIPTION = 4000; // embed description ceiling (real max 4096)
const MAX_FIELD = 1000; // embed field value ceiling (real max 1024)

const trim = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + "…" : s;

export default {
  name: "messageUpdate",
  type: "message",
  // Mirror of messageDelete: DM the owner a preview that reads like the
  // original message (author + original content), with the edit details below.
  async execute(
    oldMessage: Message,
    newMessage: Message,
    client: ClientDiscord
  ) {
    if (oldMessage?.author?.bot) return;
    if (!oldMessage?.content) return;
    if (oldMessage.content === newMessage?.content) return; // embed/pin updates fire this too
    if (oldMessage?.channel?.id !== config.gmi2Channel) return;

    const owner = await client.users.fetch(config.ownerId, { cache: false });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: oldMessage.author.username || oldMessage.author.tag,
        iconURL: oldMessage.author.displayAvatarURL(),
      })
      .setDescription(trim(oldMessage.content, MAX_DESCRIPTION))
      .addFields(
        {
          name: "📝 Editado a",
          value: trim(newMessage.content || "_(vacío)_", MAX_FIELD),
        },
        {
          name: "🔗 Mensaje",
          value: `[Ir al mensaje](${newMessage.url})`,
        }
      )
      .setColor(EDIT_COLOR)
      .setTimestamp(oldMessage.createdTimestamp ?? new Date())
      .setFooter({ text: "✏️ Editado" });

    await owner.send({ embeds: [embed] });
  },
};

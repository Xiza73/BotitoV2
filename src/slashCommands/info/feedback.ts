import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  colorForCategory,
} from "../../shared/constants/branding";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const MAX_FEEDBACK = 1500;

const pull: ISlashCommand = {
  name: "feedback",
  category: "info",
  description: "Envía feedback o sugerencias al owner del bot",
  ownerOnly: false,
  options: [
    {
      name: "message",
      description: "Tu feedback o sugerencia",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "anonymous",
      description: "Enviar sin tu nombre (default: false)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/feedback message:falta el comando X",
    "/feedback message:gran trabajo anonymous:true",
  ],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const text = args.find((a) => a.name === "message")?.value as string;
      const anonymous =
        (args.find((a) => a.name === "anonymous")?.value as
          | boolean
          | undefined) ?? false;

      if (!text || text.trim().length === 0) {
        return interaction.reply({
          content: "El mensaje no puede estar vacío.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const trimmed =
        text.length > MAX_FEEDBACK ? text.slice(0, MAX_FEEDBACK) + "…" : text;

      const embed = new EmbedBuilder()
        .setTitle("📨 Feedback recibido")
        .setDescription(trimmed)
        .setColor(colorForCategory("info"))
        .addFields({
          name: "👤 De",
          value: anonymous
            ? "_(anónimo)_"
            : `<@${interaction.user.id}> (\`${interaction.user.tag ?? interaction.user.username}\`)`,
          inline: false,
        })
        .setTimestamp(new Date())
        .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

      try {
        const owner = await client.users.fetch(client.config.ownerId);
        const dm = await owner.createDM();
        await dm.send({ embeds: [embed], allowedMentions: { parse: [] } });
      } catch {
        return interaction.reply({
          content:
            "No pude entregar tu feedback al owner. Intenta de nuevo en un rato.",
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        content: "✅ Listo, gracias por tu feedback.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

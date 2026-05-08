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

const REPO_URL = "https://github.com/Xiza73/BotitoV2";

const pull: ISlashCommand = {
  name: "about",
  category: "info",
  description: "Información del bot",
  ownerOnly: false,
  options: [
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/about", "/about private:true"],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      const embed = new EmbedBuilder()
        .setTitle(`🤖 ${BOT_BRAND_NAME}`)
        .setThumbnail(client.user?.avatarURL() ?? null)
        .setDescription(
          "Bot de Discord para el server de Gmi2. Cumpleaños, juegos, mod tools y un par de tonterías más."
        )
        .addFields(
          { name: "📦 Versión", value: `\`${BOT_VERSION}\``, inline: true },
          { name: "⚙️ Stack", value: "Node 22 · TS 5 · discord.js 14", inline: true },
          { name: "🔗 Código", value: `[GitHub](${REPO_URL})`, inline: true }
        )
        .setColor(colorForCategory("info"))
        .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

      return interaction.reply({
        embeds: [embed],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

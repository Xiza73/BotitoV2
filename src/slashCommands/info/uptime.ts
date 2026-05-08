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
import { errorHandler, formatUptime } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "uptime",
  category: "info",
  description: "Tiempo activo del bot desde el último deploy",
  ownerOnly: false,
  options: [
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/uptime", "/uptime private:true"],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      const uptimeSec = process.uptime();
      const startedTimestamp = Math.floor(
        (Date.now() - uptimeSec * 1000) / 1000
      );

      const embed = new EmbedBuilder()
        .setTitle("⏰ Uptime")
        .setDescription(`\`${formatUptime(uptimeSec)}\``)
        .addFields({
          name: "🚀 Activo desde",
          value: `<t:${startedTimestamp}:R>`,
          inline: true,
        })
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

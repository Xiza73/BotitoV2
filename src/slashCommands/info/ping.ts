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

const buildEmbed = (
  client: ClientDiscord,
  roundTripMs: number,
  apiPingMs: number,
  uptimeSec: number
) =>
  new EmbedBuilder()
    .setTitle("🏓 Pong!")
    .setThumbnail(client.user?.avatarURL() ?? null)
    .setColor(colorForCategory("info"))
    .addFields(
      {
        name: "📶 Round-trip",
        value: `\`${roundTripMs}ms\``,
        inline: true,
      },
      {
        name: "📡 API",
        value: `\`${apiPingMs}ms\``,
        inline: true,
      },
      {
        name: "⏰ Uptime",
        value: `\`${formatUptime(uptimeSec)}\``,
        inline: true,
      },
      {
        name: "📦 Versión",
        value: `\`${BOT_VERSION}\``,
        inline: true,
      }
    )
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const pull: ISlashCommand = {
  name: "ping",
  category: "info",
  description: "Mide la latencia del bot",
  ownerOnly: false,
  options: [
    {
      name: "private",
      description:
        "Mostrar la respuesta solo a vos (default: false, lo ve todo el canal)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/ping", "/ping private:true"],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as boolean | undefined) ??
        false;

      await interaction.deferReply({
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
      });

      const roundTrip = Date.now() - interaction.createdTimestamp;
      const apiPing = Math.max(0, Math.round(client.ws.ping));
      const uptime = process.uptime();

      await interaction.editReply({
        embeds: [buildEmbed(client, roundTrip, apiPing, uptime)],
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

import {
  ApplicationCommandOptionType,
  Channel,
  ChannelType,
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

const TYPE_LABELS: Partial<Record<ChannelType, string>> = {
  [ChannelType.GuildText]: "💬 Texto",
  [ChannelType.GuildVoice]: "🔊 Voz",
  [ChannelType.GuildCategory]: "📂 Categoría",
  [ChannelType.GuildAnnouncement]: "📢 Anuncios",
  [ChannelType.AnnouncementThread]: "🧵 Hilo (anuncios)",
  [ChannelType.PublicThread]: "🧵 Hilo público",
  [ChannelType.PrivateThread]: "🔒 Hilo privado",
  [ChannelType.GuildStageVoice]: "🎤 Stage",
  [ChannelType.GuildForum]: "💭 Foro",
  [ChannelType.GuildMedia]: "🖼️ Media",
  [ChannelType.DM]: "💌 DM",
  [ChannelType.GroupDM]: "👥 Group DM",
};

const formatChannelType = (type: ChannelType): string =>
  TYPE_LABELS[type] ?? `Tipo ${type}`;

const buildEmbed = (channel: Channel) => {
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  // For guild channels we can mention them; for DMs we just show "—"
  const isGuildChannel = "guild" in channel;
  const channelLabel = isGuildChannel
    ? `<#${channel.id}>`
    : (channel as any).name ?? "DM";

  fields.push({ name: "📁 Canal", value: channelLabel, inline: true });
  fields.push({ name: "🆔 ID", value: `\`${channel.id}\``, inline: true });
  fields.push({
    name: "🏷 Tipo",
    value: formatChannelType(channel.type),
    inline: true,
  });

  if (isGuildChannel) {
    const parent = (channel as any).parent;
    if (parent?.name) {
      fields.push({
        name: "📂 Categoría",
        value: parent.name,
        inline: true,
      });
    }

    if ((channel as any).nsfw === true) {
      fields.push({ name: "🔞 NSFW", value: "Sí", inline: true });
    }
  }

  return new EmbedBuilder()
    .setTitle("Información del canal")
    .setColor(colorForCategory("info"))
    .addFields(fields)
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const pull: ISlashCommand = {
  name: "channel-id",
  category: "info",
  description: "Muestra la información y el ID de un canal",
  ownerOnly: false,
  options: [
    {
      name: "channel",
      description: "Canal a consultar (default: este)",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
    {
      name: "public",
      description: "Mostrar la respuesta a todo el canal (default: solo a vos)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/channel-id",
    "/channel-id channel:#general",
    "/channel-id public:true",
  ],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const channelArg = args.find((a) => a.name === "channel")?.value as
        | string
        | undefined;
      const publicArg =
        (args.find((a) => a.name === "public")?.value as boolean | undefined) ??
        false;

      const channelId = channelArg ?? interaction.channelId;

      let channel: Channel | null = null;
      try {
        channel = await client.channels.fetch(channelId);
      } catch {
        // Fallback: if fetch fails (eg. uncached DM), use interaction.channel
        channel = interaction.channel ?? null;
      }

      if (!channel) {
        return interaction.reply({
          content: `No encontré el canal con id \`${channelId}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        embeds: [buildEmbed(channel)],
        flags: publicArg ? undefined : MessageFlags.Ephemeral,
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

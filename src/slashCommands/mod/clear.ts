import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
  TextChannel,
} from "discord.js";

import config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  colorForCategory,
} from "../../shared/constants/branding";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const NOTICE_TTL_MS = 5_000;

const baseEmbed = () =>
  new EmbedBuilder()
    .setColor(colorForCategory("mod"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const buildNoticeEmbed = (deletedCount: number) =>
  baseEmbed()
    .setTitle("🧹 Chat limpiado")
    .setDescription(
      `Se eliminaron **${deletedCount}** ${deletedCount === 1 ? "mensaje" : "mensajes"}.`
    );

const buildErrorEmbed = (reason: string) =>
  baseEmbed()
    .setTitle("❌ No se pudo limpiar el chat")
    .setDescription(reason);

const pull: ISlashCommand = {
  name: "clear",
  category: "mod",
  description: "Limpia mensajes del canal en bloque",
  ownerOnly: false,
  defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
  options: [
    {
      name: "amount",
      description: `Cantidad de mensajes a borrar (1–${config.maxDeleteMessages}, default: 1)`,
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],
  examples: ["/clear", "/clear amount:10"],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      if (
        !(interaction.member?.permissions as Readonly<PermissionsBitField>)?.has(
          PermissionFlagsBits.ManageMessages
        )
      ) {
        return interaction.reply({
          content: "No tienes permisos para eliminar mensajes.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const requested = (args.find((a) => a.name === "amount")?.value as
        | number
        | undefined) ?? 1;

      if (requested <= 0) {
        return interaction.reply({
          content:
            "La cantidad debe ser un número mayor a 0.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const amountToDelete = Math.min(requested, config.maxDeleteMessages);
      const channel = interaction.channel as TextChannel;

      // bulkDelete first, then confirm. If it throws (eg. messages older than
      // 14 days, or bot missing perms), the catch fires and errorHandler can
      // still reply because the interaction hasn't been replied yet.
      try {
        const deleted = await channel.bulkDelete(amountToDelete, true);
        await interaction.reply({
          embeds: [buildNoticeEmbed(deleted.size)],
          flags: MessageFlags.Ephemeral,
        });

        // Public, auto-deleting confirmation in the channel so users see what
        // happened without the moderator having to repeat it.
        const notice = await channel.send({
          embeds: [buildNoticeEmbed(deleted.size)],
        });
        setTimeout(() => {
          (notice as Message).delete().catch(() => {});
        }, NOTICE_TTL_MS);
      } catch (bulkErr: any) {
        // Discord throws when trying to bulk-delete >14d old messages or when
        // the bot lacks ManageMessages itself.
        return interaction.reply({
          embeds: [
            buildErrorEmbed(
              bulkErr?.message ??
                "Discord rechazó la operación. ¿Mensajes muy viejos (>14 días) o falta de permisos del bot?"
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

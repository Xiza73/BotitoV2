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
const MAX_RECAP_ATTACHMENTS = 10;
const MAX_RECAP_DESCRIPTION = 3800;

const baseEmbed = () =>
  new EmbedBuilder()
    .setColor(colorForCategory("mod"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const buildPublicNoticeEmbed = (deletedCount: number) =>
  baseEmbed()
    .setTitle("🧹 Chat limpiado")
    .setDescription(
      `Se eliminaron **${deletedCount}** ${deletedCount === 1 ? "mensaje" : "mensajes"}.`
    );

const buildErrorEmbed = (reason: string) =>
  baseEmbed()
    .setTitle("❌ No se pudo limpiar el chat")
    .setDescription(reason);

const buildEmptyEmbed = () =>
  baseEmbed()
    .setTitle("🧹 Nada para limpiar")
    .setDescription(
      "No había mensajes recientes para eliminar (Discord no permite borrar mensajes de más de 14 días en bloque)."
    );

type DownloadedAttachment = {
  msgId: string;
  name: string;
  buffer: Buffer;
};

/**
 * Fetch every attachment binary in parallel BEFORE the messages get deleted.
 * Discord's CDN URLs become invalid the moment the source message is deleted,
 * so any download has to happen first or it fails silently.
 */
const downloadAttachments = async (
  messages: Message[]
): Promise<DownloadedAttachment[]> => {
  const tasks = messages.flatMap((msg) =>
    [...msg.attachments.values()].map(
      async (att): Promise<DownloadedAttachment | null> => {
        try {
          const res = await fetch(att.url);
          if (!res.ok) return null;
          return {
            msgId: msg.id,
            name: att.name,
            buffer: Buffer.from(await res.arrayBuffer()),
          };
        } catch {
          return null;
        }
      }
    )
  );
  const settled = await Promise.all(tasks);
  return settled.filter((x): x is DownloadedAttachment => x !== null);
};

/**
 * Build the moderator-only DM recap: embed listing every deleted message
 * (chronological) plus the re-uploaded attachment Buffers Discord can serve
 * as fresh files.
 */
const buildRecap = (
  messages: Message[],
  downloaded: DownloadedAttachment[]
) => {
  const lines: string[] = [];
  let textTruncated = false;

  for (const msg of messages) {
    const ts = `<t:${Math.floor(msg.createdTimestamp / 1000)}:t>`;
    const author = `**${msg.author.username}**`;
    const body =
      msg.content?.trim() ||
      (msg.attachments.size > 0 ? "_(solo adjuntos)_" : "_(mensaje vacío)_");
    const line = `${ts} ${author}: ${body}`;

    if (lines.join("\n").length + line.length + 1 > MAX_RECAP_DESCRIPTION) {
      textTruncated = true;
      break;
    }
    lines.push(line);
  }

  // Cap attachments at Discord's per-message ceiling.
  const filesTruncated = downloaded.length > MAX_RECAP_ATTACHMENTS;
  const files = downloaded
    .slice(0, MAX_RECAP_ATTACHMENTS)
    .map((d) => ({ attachment: d.buffer, name: d.name }));

  if (textTruncated || filesTruncated) {
    lines.push("\n_(recap truncado por límites de Discord)_");
  }

  const embed = baseEmbed()
    .setTitle(`📋 Eliminados (${messages.length})`)
    .setDescription(lines.join("\n") || "_(sin contenido)_");

  return { embed, files };
};

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

      const requested =
        (args.find((a) => a.name === "amount")?.value as number | undefined) ??
        1;
      if (requested <= 0) {
        return interaction.reply({
          content: "La cantidad debe ser un número mayor a 0.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const amountToDelete = Math.min(requested, config.maxDeleteMessages);
      const channel = interaction.channel as TextChannel;

      // Defer immediately. The fetch + parallel attachment downloads can
      // easily blow past Discord's 3s acknowledgement window — without this
      // the user gets 'Unknown interaction' on anything non-trivial.
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Fetch the candidate messages BEFORE deleting them — the CDN URLs
      // for their attachments are only valid while the source still exists.
      const candidates = await channel.messages.fetch({
        limit: amountToDelete,
      });
      // fetch() returns newest-first; bulkDelete and the recap want chronological.
      const messageArr = [...candidates.values()].reverse();

      // Download every attachment binary in parallel, then bulk-delete by ID.
      const downloaded = await downloadAttachments(messageArr);

      let deletedCount: number;
      try {
        const result = await channel.bulkDelete(
          messageArr.map((m) => m.id),
          true
        );
        deletedCount = result.size;
      } catch (bulkErr: any) {
        return interaction.editReply({
          embeds: [
            buildErrorEmbed(
              bulkErr?.message ??
                "Discord rechazó la operación. ¿Mensajes muy viejos (>14 días) o falta de permisos del bot?"
            ),
          ],
        });
      }

      if (deletedCount === 0) {
        return interaction.editReply({ embeds: [buildEmptyEmbed()] });
      }

      // Recap is built from the messages we captured pre-delete (and their
      // pre-downloaded attachments) — not from bulkDelete's return, which
      // strips message bodies for messages older than 14 days.
      const { embed: recapEmbed, files } = buildRecap(messageArr, downloaded);

      // Recap goes by DM — internal log persisted in the moderator's DM
      // history, invisible to the rest of the server regardless of who ran
      // the command.
      let dmDelivered = true;
      try {
        const dm = await interaction.user.createDM();
        await dm.send({
          embeds: [recapEmbed],
          files,
          allowedMentions: { parse: [] },
        });
      } catch {
        dmDelivered = false;
      }

      // Public auto-deleting notice in the channel: just the count, no detail.
      const notice = await channel.send({
        embeds: [buildPublicNoticeEmbed(deletedCount)],
      });
      setTimeout(() => {
        (notice as Message).delete().catch(() => {});
      }, NOTICE_TTL_MS);

      // Happy path: drop the deferred ephemeral so the moderator gets no
      // visible reply in the channel — the recap is in their DM, the count
      // notice is in the channel for context. Both already cover the UX.
      if (dmDelivered) {
        try {
          await interaction.deleteReply();
        } catch {
          // Token expired or already deleted — nothing left to do.
        }
        return;
      }

      // DM fallback: when the moderator has DMs disabled, surface the recap
      // inline as the only place to see what got nuked.
      return interaction.editReply({
        content:
          "No te pude enviar DM (¿los tienes desactivados?). Te dejo el detalle acá:",
        embeds: [recapEmbed],
        files,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

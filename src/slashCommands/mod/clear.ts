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
// Discord caps a single message at 10 attachments. We cap our recap there too.
const MAX_RECAP_ATTACHMENTS = 10;
// Embed description max is 4096; leave a margin for the trailing truncation
// notice and any markdown overhead.
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

/**
 * Build the moderator-only recap of what got deleted: an embed listing each
 * message and a list of File payloads to re-upload its image attachments
 * (downloaded into Buffers because Discord's CDN URLs expire shortly after
 * the source message is deleted).
 *
 * Returns: { embed, files } ready to drop into interaction.reply().
 */
const buildRecap = async (deleted: Message[]) => {
  const lines: string[] = [];
  const files: { attachment: Buffer; name: string }[] = [];
  let truncated = false;

  for (const msg of deleted) {
    const ts = `<t:${Math.floor(msg.createdTimestamp / 1000)}:t>`;
    const author = `**${msg.author.username}**`;
    const body =
      msg.content?.trim() ||
      (msg.attachments.size > 0 ? "_(solo adjuntos)_" : "_(mensaje vacío)_");
    const line = `${ts} ${author}: ${body}`;

    // Stop adding text lines once we'd overflow the embed description.
    if (lines.join("\n").length + line.length + 1 > MAX_RECAP_DESCRIPTION) {
      truncated = true;
      break;
    }
    lines.push(line);

    // Re-upload image/file attachments as fresh files so the mod can still
    // see them after Discord drops the original CDN URLs.
    for (const att of msg.attachments.values()) {
      if (files.length >= MAX_RECAP_ATTACHMENTS) {
        truncated = true;
        break;
      }
      try {
        const res = await fetch(att.url);
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        files.push({ attachment: buf, name: att.name });
      } catch {
        // CDN URL expired or download failed — skip silently.
      }
    }
    if (files.length >= MAX_RECAP_ATTACHMENTS) truncated = true;
  }

  if (truncated) {
    lines.push("\n_(recap truncado por límites de Discord)_");
  }

  const embed = baseEmbed()
    .setTitle(`📋 Eliminados (${deleted.length})`)
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

      let deletedCollection;
      try {
        deletedCollection = await channel.bulkDelete(amountToDelete, true);
      } catch (bulkErr: any) {
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

      // bulkDelete returns newest-first; show the recap chronologically.
      const deletedMessages = [...deletedCollection.values()].reverse() as Message[];

      if (deletedMessages.length === 0) {
        return interaction.reply({
          embeds: [buildEmptyEmbed()],
          flags: MessageFlags.Ephemeral,
        });
      }

      const { embed: recapEmbed, files } = await buildRecap(deletedMessages);

      // Recap goes by DM — it's an internal log of what got nuked, persists
      // in the moderator's DM history, and stays invisible to the rest of
      // the server regardless of who ran the command.
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

      // Ephemeral confirmation to the invoker. If the DM made it through,
      // it's just a 'done'. If it didn't (DMs disabled), fall back to
      // showing the recap inline so the moderator still has the data.
      if (dmDelivered) {
        await interaction.reply({
          content: "✅ Listo. Te envié el detalle por DM.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content:
            "No te pude enviar DM (¿los tenés desactivados?). Te dejo el detalle acá:",
          embeds: [recapEmbed],
          files,
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }

      // Public auto-deleting notice in the channel: just the count, no detail.
      const notice = await channel.send({
        embeds: [buildPublicNoticeEmbed(deletedMessages.length)],
      });
      setTimeout(() => {
        (notice as Message).delete().catch(() => {});
      }, NOTICE_TTL_MS);
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

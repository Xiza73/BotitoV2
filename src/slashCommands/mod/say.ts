import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";

import ClientDiscord from "../../shared/classes/ClientDiscord";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "say",
  category: "mod",
  description: "Repite un mensaje en el canal",
  ownerOnly: false,
  defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
  options: [
    {
      name: "message",
      description: "Texto a publicar",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "as_embed",
      description: "Publicar como embed (default: false)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/say message:hola a todos",
    "/say message:Anuncio importante as_embed:true",
  ],
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
          content: "No tienes los permisos requeridos para usar este comando.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (!interaction.channel?.isSendable()) {
        return interaction.reply({
          content: "Este canal no soporta envío de mensajes.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const text = args.find((a) => a.name === "message")?.value as string;
      const asEmbed =
        (args.find((a) => a.name === "as_embed")?.value as boolean) ?? false;

      // IMPORTANT: send first, confirm second. If channel.send fails (eg. bot
      // missing Send permission), the catch fires and errorHandler can still
      // reply because we haven't replied yet.
      if (asEmbed) {
        // White color and no footer — the embed is meant to look like a
        // moderator-amplified message, not a bot-branded announcement.
        const embed = new EmbedBuilder().setDescription(text).setColor("White");
        await interaction.channel.send({ embeds: [embed] });
      } else {
        await interaction.channel.send(text);
      }

      return interaction.reply({
        content: "✅ Mensaje enviado.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

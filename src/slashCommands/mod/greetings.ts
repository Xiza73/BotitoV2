import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";

import * as userDao from "../../api/dao/user.dao";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  colorForCategory,
} from "../../shared/constants/branding";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "greetings",
  category: "mod",
  description: "Activa o desactiva el saludo de cumpleaños de un miembro",
  ownerOnly: false,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "user",
      description: "Miembro registrado",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "enabled",
      description: "true = saludar en su cumpleaños, false = no saludar",
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    },
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/greetings user:@diego enabled:false",
    "/greetings user:@carlos enabled:true private:true",
  ],
  run: async (
    _client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      if (
        !(
          interaction.member?.permissions as Readonly<PermissionsBitField>
        )?.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({
          content: "Necesitas permiso de Administrator para usar este comando.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const userId = args.find((a) => a.name === "user")?.value as string;
      const enabled = args.find((a) => a.name === "enabled")?.value as boolean;
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      const data = await userDao.setGreetings(userId, enabled);
      const success = data.statusCode === 200;

      const embed = new EmbedBuilder()
        .setColor(colorForCategory("mod"))
        .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` })
        .setTitle(
          success ? "🎂 Saludo actualizado" : "❌ No se pudo actualizar"
        )
        .setDescription(data.message)
        .addFields(
          { name: "👤 Miembro", value: `<@${userId}>`, inline: true },
          {
            name: "🔔 Saludo",
            value: enabled ? "Activado" : "Desactivado",
            inline: true,
          }
        )
        .setTimestamp(new Date());

      return interaction.reply({
        embeds: [embed],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
        allowedMentions: { users: [] },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

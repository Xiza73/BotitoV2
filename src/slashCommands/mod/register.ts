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

const baseEmbed = () =>
  new EmbedBuilder()
    .setColor(colorForCategory("mod"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const pull: ISlashCommand = {
  name: "register",
  category: "mod",
  description: "Agrega un miembro a la base de datos de Gmi2",
  ownerOnly: false,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "name",
      description: "Nombre real del miembro",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "user",
      description: "Usuario de Discord",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "day",
      description: "Día de cumpleaños (1-31)",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: "month",
      description: "Mes de cumpleaños (1-12)",
      type: ApplicationCommandOptionType.Integer,
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
    "/register name:Diego user:@diego day:17 month:2",
    "/register name:Carlos user:@carlos day:5 month:11 private:true",
  ],
  run: async (
    client: ClientDiscord,
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

      const name = args.find((a) => a.name === "name")?.value as string;
      const userId = args.find((a) => a.name === "user")?.value as string;
      const day = args.find((a) => a.name === "day")?.value as number;
      const month = args.find((a) => a.name === "month")?.value as number;
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      // Validate ranges before hitting the DAO so we get a friendly error
      // instead of letting bad data sneak into Mongo.
      if (day < 1 || day > 31) {
        return interaction.reply({
          content: "El día debe estar entre 1 y 31.",
          flags: MessageFlags.Ephemeral,
        });
      }
      if (month < 1 || month > 12) {
        return interaction.reply({
          content: "El mes debe estar entre 1 y 12.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const user = await client.users.fetch(userId);
      const data = await userDao.addUser({
        name,
        discordId: user.id,
        birthdayDay: day.toString(),
        birthdayMonth: month.toString(),
      });

      const success = data.statusCode === 200;
      const embed = baseEmbed()
        .setTitle(success ? "✅ Miembro registrado" : "❌ Error al registrar")
        .setDescription(data.message)
        .addFields(
          { name: "👤 Miembro", value: `<@${user.id}> (**${name}**)`, inline: true },
          { name: "🎂 Cumpleaños", value: `\`${day}/${month}\``, inline: true }
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

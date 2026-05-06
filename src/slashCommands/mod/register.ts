import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ApplicationCommandOptionType } from "discord.js";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";
import * as userDao from "../../api/dao/user.dao";

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
          content: "Necesitás permiso de Administrator para usar este comando.",
          ephemeral: true,
        });
      }

      const name = args.find((a) => a.name === "name")?.value as string;
      const userId = args.find((a) => a.name === "user")?.value as string;
      const day = args.find((a) => a.name === "day")?.value as number;
      const month = args.find((a) => a.name === "month")?.value as number;

      const user = await client.users.fetch(userId);
      const data = await userDao.addUser({
        name,
        discordId: user.id,
        birthdayDay: day.toString(),
        birthdayMonth: month.toString(),
      });

      const embed = new EmbedBuilder({
        title: `Status: ${data.statusCode}`,
        description: data.message,
        timestamp: new Date().toISOString(),
      }).setColor("Random");

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

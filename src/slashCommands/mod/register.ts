import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";
import * as userDao from "../../api/dao/user.dao";

const ALLOWED_ROLES = ["Staff", "Admin"] as const;

const pull: ISlashCommand = {
  name: "register",
  category: "mod",
  description: "Agrega un miembro a la base de datos de Gmi2",
  ownerOnly: false,
  options: [
    {
      name: "name",
      description: "Nombre real del miembro",
      type: MoreCommandTypes.STRING,
      required: true,
    },
    {
      name: "user",
      description: "Usuario de Discord",
      type: MoreCommandTypes.USER,
      required: true,
    },
    {
      name: "day",
      description: "Día de cumpleaños (1-31)",
      type: MoreCommandTypes.INTEGER,
      required: true,
    },
    {
      name: "month",
      description: "Mes de cumpleaños (1-12)",
      type: MoreCommandTypes.INTEGER,
      required: true,
    },
  ],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const member = interaction.member as GuildMember | null;
      const highestRole = member?.roles.highest.name;
      if (!highestRole || !ALLOWED_ROLES.includes(highestRole as any)) {
        return interaction.reply({
          content:
            `No tiene permisos para esta acción\n` +
            `rol actual: ${highestRole ?? "?"}\n` +
            `rol requerido: ${ALLOWED_ROLES.join(" o ")}`,
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

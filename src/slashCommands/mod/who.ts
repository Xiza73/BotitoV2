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
import calendar from "../../shared/constants/calendar";
import {
  getUserById,
  getUserByName,
} from "../../shared/services/user.service";
import { Argument, ISlashCommand, Month } from "../../shared/types";
import { errorHandler, mentionUser } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "who",
  category: "mod",
  description: "Muestra los datos de un miembro de Gmi2",
  ownerOnly: false,
  options: [
    {
      name: "user",
      description: "Buscar por usuario de Discord",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
    {
      name: "name",
      description: "Buscar por nombre real",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/who", "/who user:@diego", "/who name:Diego", "/who private:true"],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const userId = args.find((a) => a.name === "user")?.value as
        | string
        | undefined;
      const name = args.find((a) => a.name === "name")?.value as
        | string
        | undefined;
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      let res;
      if (userId) {
        res = await getUserById(userId);
      } else if (name) {
        res = await getUserByName(name);
      } else {
        res = await getUserById(interaction.user.id);
      }

      if (!res) throw new Error("No se encontró usuario");

      const user = await client.users.fetch(res.discordId);

      const monthIndex = (parseInt(res.birthdayMonth) - 1) as Month;
      const monthName = calendar.months[monthIndex] ?? "?";

      const embed = new EmbedBuilder()
        .setTitle("🎂 CUMpleaños")
        .setThumbnail(user.avatarURL() ?? null)
        .setDescription(`${mentionUser(res.discordId)} — **${res.name}**`)
        .addFields({
          name: "📅 Fecha",
          value: `\`${res.birthdayDay} de ${monthName}\``,
        })
        .setColor(colorForCategory("mod"))
        .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

      return interaction.reply({
        embeds: [embed],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

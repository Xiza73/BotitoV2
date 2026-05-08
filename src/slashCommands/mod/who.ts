import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
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
import { errorHandler, nextBirthdayDate } from "../../shared/utils/helpers";

const discordRelative = (date: Date | number) => {
  const seconds = Math.floor(
    (typeof date === "number" ? date : date.getTime()) / 1000
  );
  return `<t:${seconds}:R>`;
};

const discordDate = (date: Date | number) => {
  const seconds = Math.floor(
    (typeof date === "number" ? date : date.getTime()) / 1000
  );
  return `<t:${seconds}:D>`;
};

const formatTopRoles = (member: GuildMember): string | null => {
  const roles = member.roles.cache
    .filter((r) => r.name !== "@everyone")
    .sort((a, b) => b.position - a.position)
    .first(3);
  if (roles.length === 0) return null;
  return roles.map((r) => `<@&${r.id}>`).join(" ");
};

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
      const guildMember = interaction.guild
        ? await interaction.guild.members.fetch(res.discordId).catch(() => null)
        : null;

      const day = parseInt(res.birthdayDay);
      const month = parseInt(res.birthdayMonth);
      const monthName = calendar.months[(month - 1) as Month] ?? "?";
      const nextBday = nextBirthdayDate(day, month);

      const fields: { name: string; value: string; inline?: boolean }[] = [
        {
          name: "👤 Discord",
          value: `<@${res.discordId}> (\`${user.tag ?? user.username}\`)`,
          inline: false,
        },
        {
          name: "🎂 Cumpleaños",
          value: `\`${day} de ${monthName}\``,
          inline: true,
        },
        {
          name: "📅 Próximo cumple",
          value: discordRelative(nextBday),
          inline: true,
        },
        {
          name: "📆 Cuenta creada",
          value: discordDate(user.createdTimestamp),
          inline: true,
        },
      ];

      if (guildMember?.joinedTimestamp) {
        fields.push({
          name: "🎉 En el servidor desde",
          value: discordDate(guildMember.joinedTimestamp),
          inline: true,
        });
      }

      if (guildMember) {
        const topRoles = formatTopRoles(guildMember);
        if (topRoles) {
          fields.push({
            name: "✨ Roles principales",
            value: topRoles,
            inline: false,
          });
        }
      }

      // No setDescription here on purpose: the '👤 Discord' field already
      // carries the mention (and the tag), so a description with just the
      // mention was redundant.
      const embed = new EmbedBuilder()
        .setTitle(res.name)
        .setThumbnail(user.avatarURL() ?? null)
        .addFields(fields)
        .setColor(colorForCategory("mod"))
        .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

      return interaction.reply({
        embeds: [embed],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

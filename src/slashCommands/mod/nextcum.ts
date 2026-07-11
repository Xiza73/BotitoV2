import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
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
import { getBirthdays } from "../../shared/services/birthday.service";
import { Argument, ISlashCommand, Month } from "../../shared/types";
import { errorHandler, nextBirthdayDate } from "../../shared/utils/helpers";

const PREV_ID = "nextcum-prev";
const NEXT_ID = "nextcum-next";
const NAV_TIMEOUT_MS = 60_000;

type Entry = {
  name: string;
  discordId: string;
  day: number;
  month: number;
  avatar: string | null;
};

// calendar.months is a 0-indexed map { 0: "Enero", ... }; invert it once.
const monthNumber = (name: string): number => {
  const entry = Object.entries(calendar.months).find(([, v]) => v === name);
  return entry ? parseInt(entry[0]) + 1 : 1;
};

/** Flatten the month-grouped birthdays into one list sorted by next occurrence. */
const sortedEntries = (grouped: Record<string, any[]>): Entry[] => {
  const flat: Omit<Entry, "avatar">[] = [];
  for (const [monthName, users] of Object.entries(grouped)) {
    const month = monthNumber(monthName);
    for (const u of users) {
      flat.push({
        name: u.name,
        discordId: u.discordId,
        day: parseInt(u.birthdayDay),
        month,
      });
    }
  }
  return flat
    .map((e) => ({ ...e, avatar: null }))
    .sort(
      (a, b) =>
        nextBirthdayDate(a.day, a.month).getTime() -
        nextBirthdayDate(b.day, b.month).getTime()
    );
};

const renderEmbed = (e: Entry, idx: number, total: number) => {
  const monthName = calendar.months[(e.month - 1) as Month];
  const relative = Math.floor(
    nextBirthdayDate(e.day, e.month).getTime() / 1000
  );
  return new EmbedBuilder()
    .setTitle("🎂 Próximo cumple")
    .setThumbnail(e.avatar)
    .setDescription(`**${e.name}** — <@${e.discordId}>`)
    .addFields(
      { name: "📅 Fecha", value: `\`${e.day} de ${monthName}\``, inline: true },
      { name: "⏳ Faltan", value: `<t:${relative}:R>`, inline: true }
    )
    .setColor(colorForCategory("mod"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION} · ${idx + 1}/${total}` });
};

const navRow = () =>
  new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder()
      .setCustomId(PREV_ID)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(NEXT_ID)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
  );

const pull: ISlashCommand = {
  name: "nextcum",
  category: "mod",
  description: "Muestra el próximo cumpleaños registrado (con flechas para navegar)",
  ownerOnly: false,
  options: [
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/nextcum", "/nextcum private:true"],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;
      const flags = isPrivate ? MessageFlags.Ephemeral : undefined;

      const entries = sortedEntries(await getBirthdays());
      if (entries.length === 0) {
        return interaction.reply({
          content: "No hay cumpleaños próximos registrados.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // ponytail: pre-fetch every avatar so navigation is sync; fine for a
      // friend server, switch to per-click fetch if the list ever grows big.
      await Promise.all(
        entries.map(async (e) => {
          const u = await client.users.fetch(e.discordId).catch(() => null);
          e.avatar = u?.avatarURL() ?? null;
        })
      );

      let idx = 0;
      const total = entries.length;
      const single = total === 1;

      await interaction.reply({
        embeds: [renderEmbed(entries[idx], idx, total)],
        components: single ? [] : [navRow()],
        flags,
        allowedMentions: { parse: [] },
      });

      if (single) return;

      const message = await interaction.fetchReply();
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: NAV_TIMEOUT_MS,
        filter: (i) => i.user.id === interaction.user.id,
      });

      collector.on("collect", async (i) => {
        idx =
          i.customId === NEXT_ID
            ? (idx + 1) % total
            : (idx - 1 + total) % total;
        await i.update({
          embeds: [renderEmbed(entries[idx], idx, total)],
          components: [navRow()],
        });
      });

      collector.on("end", async () => {
        await interaction.editReply({ components: [] }).catch(() => {});
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

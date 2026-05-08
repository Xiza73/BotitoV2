import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
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
import { CHANGELOG, ChangelogEntry } from "../../shared/constants/changelog";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

// Discord embed description maxes out at 4096; we leave a margin for the
// field-style version headers we render inline.
const MAX_DESCRIPTION = 3800;

const buildAllVersionsEmbed = () => {
  const lines: string[] = [];
  for (const entry of CHANGELOG) {
    const header = `### \`v${entry.version}\` — ${entry.date}`;
    const body = entry.highlights.map((h) => `• ${h}`).join("\n");
    const block = `${header}\n${body}\n`;

    if (lines.join("\n").length + block.length > MAX_DESCRIPTION) {
      lines.push("\n_(versiones más viejas truncadas)_");
      break;
    }
    lines.push(block);
  }

  return new EmbedBuilder()
    .setTitle("📜 Changelog")
    .setDescription(lines.join("\n").trim() || "_(sin entradas)_")
    .setColor(colorForCategory("info"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const buildSingleVersionEmbed = (entry: ChangelogEntry) =>
  new EmbedBuilder()
    .setTitle(`📜 Changelog — v${entry.version}`)
    .setDescription(`**${entry.date}**\n\n${entry.highlights.map((h) => `• ${h}`).join("\n")}`)
    .setColor(colorForCategory("info"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const pull: ISlashCommand = {
  name: "changelog",
  category: "info",
  description: "Lista los cambios y novedades del bot",
  ownerOnly: false,
  options: [
    {
      name: "version",
      description: "Versión específica a mostrar (default: todas)",
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/changelog", "/changelog version:0.4.0"],
  autocomplete: async (
    _: ClientDiscord,
    interaction: AutocompleteInteraction
  ) => {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "version") {
      await interaction.respond([]);
      return;
    }
    const query = String(focused.value ?? "").toLowerCase();
    const matches = CHANGELOG.filter((e) => e.version.includes(query))
      .slice(0, 25)
      .map((e) => ({ name: `v${e.version} (${e.date})`, value: e.version }));
    await interaction.respond(matches);
  },
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const versionArg = args.find((a) => a.name === "version")?.value as
        | string
        | undefined;
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;
      const flags = isPrivate ? MessageFlags.Ephemeral : undefined;

      if (versionArg) {
        const entry = CHANGELOG.find((e) => e.version === versionArg);
        if (!entry) {
          return interaction.reply({
            content: `No encontré la versión \`${versionArg}\`.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        return interaction.reply({
          embeds: [buildSingleVersionEmbed(entry)],
          flags,
        });
      }

      return interaction.reply({
        embeds: [buildAllVersionsEmbed()],
        flags,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

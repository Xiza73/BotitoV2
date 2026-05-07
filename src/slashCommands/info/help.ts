import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  capitalize,
  colorForCategory,
  emojiForCategory,
} from "../../shared/constants/branding";
import {
  Argument,
  ISlashCommand,
  SlashCommandsOptions,
} from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const SELECT_CUSTOM_ID = "help-pick-command";
const SELECT_TIMEOUT_MS = 60_000;

const formatOption = (opt: SlashCommandsOptions): string => {
  const flag = opt.required ? "**" : "";
  const star = opt.required ? "" : " *(opcional)*";
  return `${flag}\`${opt.name}\`${flag}${star} — ${opt.description}`;
};

const visibleCommandsFor = (
  client: ClientDiscord,
  isOwner: boolean
): ISlashCommand[] => {
  const all = [...client.slashCommands.values()];
  return isOwner ? all : all.filter((c) => !c.ownerOnly);
};

const buildAuthor = (client: ClientDiscord) => ({
  name: BOT_BRAND_NAME,
  iconURL: client.user?.avatarURL() ?? undefined,
});

const buildFooter = (extra?: string) => ({
  text: `${BOT_BRAND_NAME} ${BOT_VERSION}${extra ? ` · ${extra}` : ""}`,
});

const buildListEmbed = (
  client: ClientDiscord,
  userId: string,
  filterCategory: string | null,
  isOwner: boolean
) => {
  const visible = visibleCommandsFor(client, isOwner);
  const filtered = filterCategory
    ? visible.filter((c) => c.category === filterCategory)
    : visible;

  const categories = [
    ...new Set(
      filtered.map((c) => c.category).filter((c): c is string => Boolean(c))
    ),
  ].sort();

  const fields = categories.map((cat) => ({
    name: `${emojiForCategory(cat)} ${capitalize(cat)}`,
    value:
      filtered
        .filter((c) => c.category === cat)
        .map((c) => `**\`/${c.name}\`**`)
        .join(" · ") || "—",
    inline: false,
  }));

  return new EmbedBuilder()
    .setAuthor(buildAuthor(client))
    .setTitle(filterCategory ? `Comandos de ${capitalize(filterCategory)}` : "Help")
    .setThumbnail(client.user?.avatarURL() ?? null)
    .setDescription(
      `Hola **<@${userId}>** — elegí un comando del menú o usa \`/help command:<nombre>\` para ver el detalle.\n` +
        `**Total:** ${filtered.length} ${filtered.length === 1 ? "comando" : "comandos"}`
    )
    .setColor(filterCategory ? colorForCategory(filterCategory) : colorForCategory("info"))
    .addFields(fields)
    .setFooter(
      buildFooter(filterCategory ? "/help solo para ver todos" : undefined)
    );
};

const buildDetailEmbed = (client: ClientDiscord, command: ISlashCommand) => {
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  fields.push({
    name: "Categoría",
    value: command.category
      ? `${emojiForCategory(command.category)} ${capitalize(command.category)}`
      : "—",
    inline: true,
  });

  if (command.ownerOnly) {
    fields.push({ name: "Acceso", value: "🔒 Solo owner", inline: true });
  }

  if (command.options && command.options.length > 0) {
    fields.push({
      name: "Opciones",
      value: command.options.map(formatOption).join("\n"),
    });
  }

  if (command.examples && command.examples.length > 0) {
    fields.push({
      name: "Ejemplos",
      value: command.examples.map((e) => `\`${e}\``).join("\n"),
    });
  }

  return new EmbedBuilder()
    .setAuthor(buildAuthor(client))
    .setTitle(`/${command.name}`)
    .setDescription(command.description || "Sin descripción")
    .setColor(colorForCategory(command.category))
    .addFields(fields)
    .setFooter(buildFooter("/help para ver todos los comandos"));
};

const buildSelectRow = (commands: ISlashCommand[]) => {
  const options = commands.slice(0, 25).map((c) => ({
    label: `/${c.name}`,
    description: c.description.slice(0, 100),
    value: c.name,
  }));

  if (options.length === 0) return null;

  return new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
    new StringSelectMenuBuilder()
      .setCustomId(SELECT_CUSTOM_ID)
      .setPlaceholder("Elegí un comando para ver el detalle…")
      .addOptions(options)
  );
};

const attachSelectCollector = async (
  client: ClientDiscord,
  interaction: ChatInputCommandInteraction
) => {
  try {
    const message = await interaction.fetchReply();
    const select = (await message.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: SELECT_TIMEOUT_MS,
      filter: (i) =>
        i.user.id === interaction.user.id && i.customId === SELECT_CUSTOM_ID,
    })) as StringSelectMenuInteraction;

    const isOwner = interaction.user.id === client.config.ownerId;
    const command = client.slashCommands.get(select.values[0]);
    if (!command || (command.ownerOnly && !isOwner)) {
      await select.update({
        content: `No existe un slash command llamado "${select.values[0]}".`,
        embeds: [],
        components: [],
      });
      return;
    }

    await select.update({
      embeds: [buildDetailEmbed(client, command)],
      components: [],
    });
  } catch {
    // Timeout or interaction expired — strip the select so the message
    // doesn't keep an orphan dropdown.
    try {
      await interaction.editReply({ components: [] });
    } catch {
      // best-effort; ignore if the interaction is already gone
    }
  }
};

const pull: ISlashCommand = {
  name: "help",
  category: "info",
  description: "Lista los slash commands o muestra el detalle de uno",
  ownerOnly: false,
  options: [
    {
      name: "command",
      description: "Slash command a mostrar en detalle",
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
    {
      name: "category",
      description: "Filtrar el listado por categoría",
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
    {
      name: "public",
      description: "Mostrar la respuesta a todo el canal (default: solo a vos)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/help",
    "/help command:ping",
    "/help category:fun",
    "/help public:true",
  ],
  autocomplete: async (
    client: ClientDiscord,
    interaction: AutocompleteInteraction
  ) => {
    const focused = interaction.options.getFocused(true);
    const query = String(focused.value ?? "").toLowerCase();
    const isOwner = interaction.user.id === client.config.ownerId;
    const visible = visibleCommandsFor(client, isOwner);

    if (focused.name === "command") {
      const matches = visible
        .filter((c) => c.name.toLowerCase().includes(query))
        .slice(0, 25)
        .map((c) => ({ name: `/${c.name}`, value: c.name }));
      await interaction.respond(matches);
      return;
    }

    if (focused.name === "category") {
      const cats = [
        ...new Set(
          visible.map((c) => c.category).filter((c): c is string => Boolean(c))
        ),
      ];
      const matches = cats
        .filter((c) => c.toLowerCase().includes(query))
        .slice(0, 25)
        .map((c) => ({
          name: `${emojiForCategory(c)} ${capitalize(c)}`,
          value: c,
        }));
      await interaction.respond(matches);
    }
  },
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const commandArg = args.find((a) => a.name === "command")?.value as
        | string
        | undefined;
      const categoryArg = args.find((a) => a.name === "category")?.value as
        | string
        | undefined;
      const publicArg =
        (args.find((a) => a.name === "public")?.value as boolean | undefined) ??
        false;
      const isOwner = interaction.user.id === client.config.ownerId;

      // Detail view — no select, just the embed.
      if (commandArg) {
        const command = client.slashCommands.get(commandArg.toLowerCase());
        if (!command || (command.ownerOnly && !isOwner)) {
          return interaction.reply({
            content: `No existe un slash command llamado "${commandArg}".`,
            ephemeral: true,
          });
        }
        return interaction.reply({
          embeds: [buildDetailEmbed(client, command)],
          ephemeral: !publicArg,
          allowedMentions: { repliedUser: false },
        });
      }

      // Listing — embed + select menu so the user can drill in without
      // re-typing /help.
      const visible = visibleCommandsFor(client, isOwner);
      const filtered = categoryArg
        ? visible.filter((c) => c.category === categoryArg)
        : visible;
      const row = buildSelectRow(filtered);

      await interaction.reply({
        embeds: [
          buildListEmbed(
            client,
            interaction.user.id,
            categoryArg ?? null,
            isOwner
          ),
        ],
        components: row ? [row] : [],
        ephemeral: !publicArg,
        allowedMentions: { repliedUser: false },
      });

      if (row) {
        // Fire-and-forget: collector lives until selection or timeout.
        attachSelectCollector(client, interaction);
      }
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

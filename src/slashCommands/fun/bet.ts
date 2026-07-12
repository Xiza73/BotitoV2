import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

import * as betDao from "../../api/dao/bet.dao";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  colorForCategory,
} from "../../shared/constants/branding";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const SUB = {
  create: "create",
  place: "place",
  status: "status",
  resolve: "resolve",
  balance: "balance",
  grant: "grant",
} as const;

const OPT = {
  title: "title",
  options: "options",
  wager: "wager",
  option: "option",
  amount: "amount",
  winner: "winner",
  user: "user",
} as const;

const MAX_OPTIONS = 10;

type SubArg = NonNullable<Argument["args"]>[number];
const findArg = (args: SubArg[] | undefined, name: string) =>
  args?.find((a) => a.name === name)?.value;
const isOwner = (i: ChatInputCommandInteraction, c: ClientDiscord) =>
  i.user.id === c.config.ownerId;

const baseEmbed = () =>
  new EmbedBuilder()
    .setColor(colorForCategory("fun"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const parseOptions = (raw: string): string[] => {
  const seen = new Set<string>();
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
};

const eph = (content: string) =>
  ({ content, flags: MessageFlags.Ephemeral }) as const;

// ── create ──────────────────────────────────────────────────────────────────
const handleCreate = async (
  interaction: ChatInputCommandInteraction,
  subArgs: SubArg[]
) => {
  const title = (findArg(subArgs, OPT.title) as string).trim();
  const options = parseOptions(findArg(subArgs, OPT.options) as string);

  if (options.length < 2) {
    return interaction.reply(
      eph("Necesitas al menos 2 opciones separadas por coma.")
    );
  }
  if (options.length > MAX_OPTIONS) {
    return interaction.reply(eph(`Máximo ${MAX_OPTIONS} opciones.`));
  }

  const wager = await betDao.createWager(title, options, interaction.user.id);
  const coin = await betDao.getCoinName();

  const embed = baseEmbed()
    .setTitle(`🎲 ${title}`)
    .setDescription(
      `Apuesta abierta. Usa \`/bet place\` para apostar tus ${coin}.`
    )
    .addFields({
      name: "Opciones",
      value: options.map((o) => `• ${o}`).join("\n"),
    });

  return interaction.reply({
    embeds: [embed],
    allowedMentions: { parse: [] },
  });
};

// ── place ───────────────────────────────────────────────────────────────────
const handlePlace = async (
  interaction: ChatInputCommandInteraction,
  subArgs: SubArg[]
) => {
  const wagerId = findArg(subArgs, OPT.wager) as string;
  const option = findArg(subArgs, OPT.option) as string;
  const amount = findArg(subArgs, OPT.amount) as number;
  const coin = await betDao.getCoinName();

  if (amount < 1) return interaction.reply(eph("El monto debe ser al menos 1."));

  const wager = await betDao.getWager(wagerId);
  if (!wager || wager.status !== "open") {
    return interaction.reply(eph("Esa apuesta no existe o ya cerró."));
  }
  if (!wager.options.includes(option)) {
    return interaction.reply(
      eph(`Opción inválida. Elegí una de: ${wager.options.join(", ")}.`)
    );
  }

  const res = await betDao.placeBet(
    wagerId,
    interaction.user.id,
    option,
    amount
  );
  if (!res.ok) {
    return interaction.reply(
      eph(
        res.reason === "insufficient"
          ? `No te alcanzan los ${coin}.`
          : "Ya apostaste en esta apuesta."
      )
    );
  }

  return interaction.reply(
    eph(
      `✅ Apostaste **${amount}** ${coin} en **${option}**. Saldo: **${res.balance}**.`
    )
  );
};

// ── status ──────────────────────────────────────────────────────────────────
const handleStatus = async (
  interaction: ChatInputCommandInteraction,
  subArgs: SubArg[]
) => {
  const wagerId = findArg(subArgs, OPT.wager) as string;
  const wager = await betDao.getWager(wagerId);
  if (!wager) return interaction.reply(eph("Esa apuesta no existe."));

  const bets = await betDao.getBets(wagerId);
  const total = bets.reduce((s, b) => s + b.amount, 0);
  const coin = await betDao.getCoinName();

  const fields = wager.options.map((opt) => {
    const forOpt = bets.filter((b) => b.option === opt);
    const pool = forOpt.reduce((s, b) => s + b.amount, 0);
    const mult = pool > 0 ? (total / pool).toFixed(2) : "—";
    return {
      name: opt,
      value: `Pozo: **${pool}** ${coin}\nApostaron: **${forOpt.length}**\nPaga: **x${mult}**`,
      inline: true,
    };
  });

  const embed = baseEmbed()
    .setTitle(`🎲 ${wager.title}`)
    .setDescription(
      wager.status === "resolved"
        ? `✅ Resuelta — ganó **${wager.winnerOption}**.`
        : `Pozo total: **${total}** ${coin}.`
    )
    .addFields(fields);

  return interaction.reply({ embeds: [embed] });
};

// ── resolve (owner) ─────────────────────────────────────────────────────────
const handleResolve = async (
  client: ClientDiscord,
  interaction: ChatInputCommandInteraction,
  subArgs: SubArg[]
) => {
  if (!isOwner(interaction, client)) {
    return interaction.reply(eph("Solo el owner puede resolver apuestas."));
  }
  const wagerId = findArg(subArgs, OPT.wager) as string;
  const winner = findArg(subArgs, OPT.winner) as string;

  const wager = await betDao.getWager(wagerId);
  if (!wager) return interaction.reply(eph("Esa apuesta no existe."));
  if (wager.status === "resolved") {
    return interaction.reply(eph("Esa apuesta ya estaba resuelta."));
  }
  if (!wager.options.includes(winner)) {
    return interaction.reply(
      eph(`Opción inválida. Elegí una de: ${wager.options.join(", ")}.`)
    );
  }

  const { credits, refunded } = await betDao.resolveWager(wagerId, winner);
  const coin = await betDao.getCoinName();
  const paid = credits.reduce((s, c) => s + c.amount, 0);

  const embed = baseEmbed()
    .setTitle(`🏆 ${wager.title}`)
    .setDescription(
      refunded
        ? `Nadie le apostó a **${winner}** — se devolvieron las apuestas.`
        : `Ganó **${winner}**. Se repartieron **${paid}** ${coin} entre **${credits.length}** ${credits.length === 1 ? "ganador" : "ganadores"}.`
    );

  return interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
};

// ── balance ─────────────────────────────────────────────────────────────────
const handleBalance = async (interaction: ChatInputCommandInteraction) => {
  const balance = await betDao.getBalance(interaction.user.id);
  const coin = await betDao.getCoinName();
  return interaction.reply(eph(`💰 Tienes **${balance}** ${coin}.`));
};

// ── grant (owner) ───────────────────────────────────────────────────────────
const handleGrant = async (
  client: ClientDiscord,
  interaction: ChatInputCommandInteraction,
  subArgs: SubArg[]
) => {
  if (!isOwner(interaction, client)) {
    return interaction.reply(eph("Solo el owner puede dar monedas."));
  }
  const userId = findArg(subArgs, OPT.user) as string;
  const amount = findArg(subArgs, OPT.amount) as number;
  if (amount === 0) return interaction.reply(eph("El monto no puede ser 0."));

  const balance = await betDao.grant(userId, amount);
  const coin = await betDao.getCoinName();
  return interaction.reply(
    eph(`✅ <@${userId}> ahora tiene **${balance}** ${coin}.`)
  );
};

const pull: ISlashCommand = {
  name: "bet",
  category: "fun",
  description: "Apuestas con gmicoins (pozo compartido)",
  ownerOnly: false,
  options: [
    {
      name: SUB.create,
      description: "Crear una apuesta",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.title,
          description: "Título de la apuesta",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: OPT.options,
          description: "Opciones separadas por coma (mín. 2)",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: SUB.place,
      description: "Apostar en una opción",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.wager,
          description: "Apuesta",
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
        {
          name: OPT.option,
          description: "Opción a la que apostás",
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
        {
          name: OPT.amount,
          description: "Cantidad de gmicoins",
          type: ApplicationCommandOptionType.Integer,
          required: true,
        },
      ],
    },
    {
      name: SUB.status,
      description: "Ver el estado y los pagos de una apuesta",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.wager,
          description: "Apuesta",
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      name: SUB.resolve,
      description: "[Owner] Resolver una apuesta",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.wager,
          description: "Apuesta",
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
        {
          name: OPT.winner,
          description: "Opción ganadora",
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      name: SUB.balance,
      description: "Ver tu saldo de gmicoins",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: SUB.grant,
      description: "[Owner] Dar gmicoins a alguien",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.user,
          description: "Usuario",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: OPT.amount,
          description: "Cantidad (negativo para restar)",
          type: ApplicationCommandOptionType.Integer,
          required: true,
        },
      ],
    },
  ],
  examples: [
    "/bet create title:Boca vs River options:Boca, River, Empate",
    "/bet place wager:... option:Boca amount:100",
    "/bet status wager:...",
    "/bet balance",
  ],
  autocomplete: async (
    _: ClientDiscord,
    interaction: AutocompleteInteraction
  ) => {
    const focused = interaction.options.getFocused(true);

    if (focused.name === OPT.wager) {
      const wagers = await betDao.listOpenWagers();
      const q = String(focused.value ?? "").toLowerCase();
      await interaction.respond(
        wagers
          .filter((w) => w.title.toLowerCase().includes(q))
          .slice(0, 25)
          .map((w) => ({
            name: w.title.slice(0, 100),
            value: (w._id as any).toString(),
          }))
      );
      return;
    }

    // option / winner autocomplete depends on the selected wager
    if (focused.name === OPT.option || focused.name === OPT.winner) {
      const wagerId = interaction.options.getString(OPT.wager);
      if (!wagerId) return interaction.respond([]);
      const wager = await betDao.getWager(wagerId);
      const q = String(focused.value ?? "").toLowerCase();
      await interaction.respond(
        (wager?.options ?? [])
          .filter((o) => o.toLowerCase().includes(q))
          .slice(0, 25)
          .map((o) => ({ name: o, value: o }))
      );
      return;
    }

    await interaction.respond([]);
  },
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const sub = args[0];
      if (!sub) return;
      const subArgs = sub.args ?? [];

      switch (sub.name) {
        case SUB.create:
          return handleCreate(interaction, subArgs);
        case SUB.place:
          return handlePlace(interaction, subArgs);
        case SUB.status:
          return handleStatus(interaction, subArgs);
        case SUB.resolve:
          return handleResolve(client, interaction, subArgs);
        case SUB.balance:
          return handleBalance(interaction);
        case SUB.grant:
          return handleGrant(client, interaction, subArgs);
        default:
          return;
      }
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

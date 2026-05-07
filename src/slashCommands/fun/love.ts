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
import * as loveService from "../../shared/services/love.service";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const SUB = {
  ship: "ship",
  set: "set",
  reset: "reset",
} as const;

const OPT = {
  user1: "user1",
  user2: "user2",
  percentage: "percentage",
  verdict: "verdict",
  private: "private",
} as const;

const VERDICTS: { max: number; phrase: string }[] = [
  { max: 10, phrase: "Mejor sigan siendo conocidos. 🙅" },
  { max: 25, phrase: "No, gracias. La química explota… al revés. 🧪" },
  { max: 40, phrase: "Hay potencial, pero falta chispa. 🤏" },
  { max: 55, phrase: "Buena onda, amistad sólida. 🤝" },
  { max: 70, phrase: "Mira mira mira… algo pasa acá. 👀" },
  { max: 85, phrase: "¡Tortolitos confirmados! 💞" },
  { max: 99, phrase: "Almas gemelas, hagan los planes ya. 💞" },
  { max: 100, phrase: "💍 Casamiento ya. Compre los anillos. ⛪" },
];

const SELF_LOVE_PHRASE = "El amor propio es el mejor amor. 💖";

const verdictFor = (pct: number): string => {
  for (const v of VERDICTS) {
    if (pct <= v.max) return v.phrase;
  }
  return VERDICTS[VERDICTS.length - 1].phrase;
};

const HEART_FILLED = "❤️";
const HEART_EMPTY = "🤍";
const HEART_BAR_LENGTH = 10;

const heartBar = (pct: number): string => {
  const filled = Math.round((pct / 100) * HEART_BAR_LENGTH);
  return (
    HEART_FILLED.repeat(filled) + HEART_EMPTY.repeat(HEART_BAR_LENGTH - filled)
  );
};

const baseEmbed = () =>
  new EmbedBuilder()
    .setColor(colorForCategory("fun"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const buildShipEmbed = (
  id1: string,
  id2: string,
  percentage: number,
  customVerdict: string | null
) => {
  const isSelfShip = id1 === id2;
  const description = isSelfShip
    ? `<@${id1}> consigo mismo`
    : `<@${id1}>  +  <@${id2}>`;

  const verdictText = isSelfShip
    ? SELF_LOVE_PHRASE
    : customVerdict ?? verdictFor(percentage);

  return baseEmbed()
    .setTitle("💘 Shipping")
    .setDescription(description)
    .addFields(
      {
        name: "💯 Compatibilidad",
        value: `${heartBar(percentage)}\n**${percentage}%**`,
      },
      {
        name: "💌 Veredicto",
        value: verdictText,
      }
    );
};

type SubArg = NonNullable<Argument["args"]>[number];

const findArg = (args: SubArg[] | undefined, name: string) =>
  args?.find((a) => a.name === name)?.value;

const isOwner = (interaction: ChatInputCommandInteraction, client: ClientDiscord) =>
  interaction.user.id === client.config.ownerId;

const replyOwnerOnly = (interaction: ChatInputCommandInteraction) =>
  interaction.reply({
    content: "Solo el owner puede usar este subcomando.",
    flags: MessageFlags.Ephemeral,
  });

const handleShip = async (
  client: ClientDiscord,
  interaction: ChatInputCommandInteraction,
  subArgs: SubArg[]
) => {
  const user1 = findArg(subArgs, OPT.user1) as string;
  const user2 = findArg(subArgs, OPT.user2) as string;
  const isPrivate = (findArg(subArgs, OPT.private) as boolean | undefined) ?? false;

  // Self-ship: skip the DB roundtrip — always 100% with the self-love phrase.
  if (user1 === user2) {
    return interaction.reply({
      embeds: [buildShipEmbed(user1, user2, 100, null)],
      flags: isPrivate ? MessageFlags.Ephemeral : undefined,
      allowedMentions: { users: [] },
    });
  }

  const pair = await loveService.getOrCreatePair(user1, user2);
  if (!pair) {
    return interaction.reply({
      content: "No pude calcular la compatibilidad. Probá de nuevo en un rato.",
      flags: MessageFlags.Ephemeral,
    });
  }

  return interaction.reply({
    embeds: [buildShipEmbed(user1, user2, pair.percentage, pair.verdict)],
    flags: isPrivate ? MessageFlags.Ephemeral : undefined,
    allowedMentions: { users: [] },
  });
};

const handleSet = async (
  client: ClientDiscord,
  interaction: ChatInputCommandInteraction,
  subArgs: SubArg[]
) => {
  if (!isOwner(interaction, client)) return replyOwnerOnly(interaction);

  const user1 = findArg(subArgs, OPT.user1) as string;
  const user2 = findArg(subArgs, OPT.user2) as string;
  const percentage = findArg(subArgs, OPT.percentage) as number;
  const verdict = (findArg(subArgs, OPT.verdict) as string | undefined) ?? null;
  // Owner subcommands default to ephemeral. Add `private:false` to make it public.
  const explicitPrivate = findArg(subArgs, OPT.private) as boolean | undefined;
  const isPrivate = explicitPrivate ?? true;

  if (percentage < 0 || percentage > 100) {
    return interaction.reply({
      content: "El porcentaje debe estar entre 0 y 100.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const updated = await loveService.setOverride(
    user1,
    user2,
    percentage,
    verdict,
    interaction.user.id
  );
  if (!updated) {
    return interaction.reply({
      content: "No pude guardar el override.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = baseEmbed()
    .setTitle("✏️ Override guardado")
    .setDescription(`<@${user1}> + <@${user2}> → **${percentage}%**`)
    .addFields({
      name: "💌 Veredicto",
      value: verdict ?? "_(usa el bucket automático)_",
    });

  return interaction.reply({
    embeds: [embed],
    flags: isPrivate ? MessageFlags.Ephemeral : undefined,
    allowedMentions: { users: [] },
  });
};

const handleReset = async (
  client: ClientDiscord,
  interaction: ChatInputCommandInteraction,
  subArgs: SubArg[]
) => {
  if (!isOwner(interaction, client)) return replyOwnerOnly(interaction);

  const user1 = findArg(subArgs, OPT.user1) as string;
  const user2 = findArg(subArgs, OPT.user2) as string;
  const explicitPrivate = findArg(subArgs, OPT.private) as boolean | undefined;
  const isPrivate = explicitPrivate ?? true;

  const result = await loveService.resetPair(user1, user2);

  if (!result.ok) {
    return interaction.reply({
      content:
        result.statusCode === 404
          ? `Esa pareja no estaba registrada — no hay nada que resetear.`
          : "No pude resetear la pareja.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = baseEmbed()
    .setTitle("🔄 Pareja reseteada")
    .setDescription(
      `<@${user1}> + <@${user2}> vuelve al cálculo automático en el próximo \`/love ship\`.`
    );

  return interaction.reply({
    embeds: [embed],
    flags: isPrivate ? MessageFlags.Ephemeral : undefined,
    allowedMentions: { users: [] },
  });
};

const pull: ISlashCommand = {
  name: "love",
  category: "fun",
  description: "Shippea a dos personas y calcula su compatibilidad",
  ownerOnly: false,
  options: [
    {
      name: SUB.ship,
      description: "Calcula la compatibilidad entre dos personas",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.user1,
          description: "Primer shippeado",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: OPT.user2,
          description: "Segundo shippeado",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: OPT.private,
          description: "Mostrar la respuesta solo a vos (default: público)",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
    {
      name: SUB.set,
      description: "[Owner] Setea o edita la compatibilidad de una pareja",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.user1,
          description: "Primer shippeado",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: OPT.user2,
          description: "Segundo shippeado",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: OPT.percentage,
          description: "Porcentaje de compatibilidad (0–100)",
          type: ApplicationCommandOptionType.Integer,
          required: true,
        },
        {
          name: OPT.verdict,
          description: "Veredicto custom (default: usa el bucket automático)",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
        {
          name: OPT.private,
          description: "Mostrar la respuesta solo a vos (default: sí)",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
    {
      name: SUB.reset,
      description: "[Owner] Borra el override de una pareja (vuelve al cálculo automático)",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: OPT.user1,
          description: "Primer shippeado",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: OPT.user2,
          description: "Segundo shippeado",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: OPT.private,
          description: "Mostrar la respuesta solo a vos (default: sí)",
          type: ApplicationCommandOptionType.Boolean,
          required: false,
        },
      ],
    },
  ],
  examples: [
    "/love ship user1:@ana user2:@bob",
    "/love set user1:@ana user2:@bob percentage:95 verdict:\"Tortolitos del server\"",
    "/love reset user1:@ana user2:@bob",
  ],
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
        case SUB.ship:
          return handleShip(client, interaction, subArgs);
        case SUB.set:
          return handleSet(client, interaction, subArgs);
        case SUB.reset:
          return handleReset(client, interaction, subArgs);
        default:
          return;
      }
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

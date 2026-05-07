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
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

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

/**
 * djb2-ish 32-bit hash. Cheap, deterministic, good enough for "pick a number
 * in [0, 100] from a pair of user IDs".
 */
const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h = h | 0;
  }
  return Math.abs(h);
};

/**
 * Same pair → same percentage, regardless of which user came first.
 */
const computeCompatibility = (id1: string, id2: string): number => {
  const key = [id1, id2].sort().join("-");
  return hashString(key) % 101;
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

const buildEmbed = (id1: string, id2: string) => {
  const isSelfShip = id1 === id2;
  const pct = isSelfShip ? 100 : computeCompatibility(id1, id2);
  const verdict = isSelfShip ? SELF_LOVE_PHRASE : verdictFor(pct);

  const description = isSelfShip
    ? `<@${id1}> consigo mismo`
    : `<@${id1}>  +  <@${id2}>`;

  return new EmbedBuilder()
    .setTitle("💘 Shipping")
    .setDescription(description)
    .setColor(colorForCategory("fun"))
    .addFields(
      {
        name: "💯 Compatibilidad",
        value: `${heartBar(pct)}\n**${pct}%**`,
      },
      {
        name: "💌 Veredicto",
        value: verdict,
      }
    )
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const pull: ISlashCommand = {
  name: "love",
  category: "fun",
  description: "Shippea a dos personas y calcula su compatibilidad",
  ownerOnly: false,
  options: [
    {
      name: "user1",
      description: "Primer shippeado",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "user2",
      description: "Segundo shippeado",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "private",
      description: "Mostrar la respuesta solo a vos (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/love user1:@ana user2:@bob",
    "/love user1:@ana user2:@ana",
    "/love user1:@ana user2:@bob private:true",
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const user1 = args.find((a) => a.name === "user1")?.value as string;
      const user2 = args.find((a) => a.name === "user2")?.value as string;
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      return interaction.reply({
        embeds: [buildEmbed(user1, user2)],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
        allowedMentions: { users: [] },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

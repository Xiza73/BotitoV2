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

const MIN_COINS = 1;
const MAX_COINS = 10;

const HEADS_LABEL = "👑 Cara";
const TAILS_LABEL = "🛡 Cruz";

type FlipResult = "heads" | "tails";

const flipOnce = (): FlipResult => (Math.random() < 0.5 ? "heads" : "tails");

const labelFor = (r: FlipResult) => (r === "heads" ? HEADS_LABEL : TAILS_LABEL);

const buildEmbed = (results: FlipResult[]) => {
  const heads = results.filter((r) => r === "heads").length;
  const tails = results.length - heads;

  const lines = results.map(labelFor);

  const description =
    results.length === 1
      ? lines[0]
      : `${lines.join("\n")}\n\n**Total:** ${heads} ${
          heads === 1 ? "cara" : "caras"
        } · ${tails} ${tails === 1 ? "cruz" : "cruces"}`;

  return new EmbedBuilder()
    .setTitle("🪙 Moneda al aire")
    .setDescription(description)
    .setColor(colorForCategory("fun"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const pull: ISlashCommand = {
  name: "flip",
  category: "fun",
  description: "Tira una moneda al aire (cara o cruz)",
  ownerOnly: false,
  options: [
    {
      name: "coins",
      description: `Cantidad de monedas a tirar (${MIN_COINS}–${MAX_COINS}, default: 1)`,
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
    {
      name: "private",
      description: "Mostrar la respuesta solo a vos (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/flip", "/flip coins:5", "/flip coins:3 private:true"],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const rawCoins = args.find((a) => a.name === "coins")?.value as
        | number
        | undefined;
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as boolean | undefined) ??
        false;

      // Reject 0/negative explicitly instead of silently clamping — the user
      // probably mistyped. Big positive values still clamp to MAX_COINS.
      if (rawCoins !== undefined && rawCoins < MIN_COINS) {
        return interaction.reply({
          content: `La cantidad de monedas debe ser al menos ${MIN_COINS}.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const coins = Math.min(rawCoins ?? 1, MAX_COINS);

      const results: FlipResult[] = [];
      for (let i = 0; i < coins; i++) results.push(flipOnce());

      return interaction.reply({
        embeds: [buildEmbed(results)],
        flags: isPrivate ? MessageFlags.Ephemeral : undefined,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

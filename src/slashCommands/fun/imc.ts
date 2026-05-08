import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
} from "../../shared/constants/branding";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

type ImcRange = {
  message: string;
  icon: string;
  color: string;
};

/**
 * Data-driven color: red/yellow/green according to the BMI bucket. We INTENTIONALLY
 * deviate from the fun-category yellow here — the status color encodes real meaning
 * (healthy / overweight / underweight), not just branding. The convention of
 * "color matches the category" bends when the color is a signal.
 */
const imcData: { [threshold: string]: ImcRange } = {
  "18.5": { message: "Bajo peso", icon: "🙀", color: "#ff0000" },
  "24.9": { message: "Peso normal", icon: "😺", color: "#00ff00" },
  "29.9": { message: "Sobrepeso", icon: "😿", color: "#ffff00" },
  "34.9": { message: "Obesidad grado 1", icon: "😾", color: "#ff0000" },
  "39.9": { message: "Obesidad grado 2", icon: "💀", color: "#ff0000" },
  "100": { message: "Obesidad grado 3", icon: "☠️", color: "#ff0000" },
};

const thresholds = Object.keys(imcData)
  .map((k) => parseFloat(k))
  .sort((a, b) => a - b);

const findRange = (imc: number): ImcRange => {
  for (const t of thresholds) {
    if (imc < t) return imcData[t.toString()]!;
  }
  return imcData[thresholds[thresholds.length - 1].toString()]!;
};

/**
 * Healthy weight range derived from BMI 18.5–24.9 for the given height in meters.
 * Returns kg with one decimal place.
 */
const idealWeightRange = (heightM: number): { min: number; max: number } => ({
  min: Math.round(18.5 * heightM * heightM * 10) / 10,
  max: Math.round(24.9 * heightM * heightM * 10) / 10,
});

const pull: ISlashCommand = {
  name: "imc",
  category: "fun",
  description: "Calcula tu Índice de Masa Corporal",
  ownerOnly: false,
  options: [
    {
      name: "peso",
      description: "Peso en kg",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "altura",
      description: "Altura en metros (o cm si pasas un valor mayor a 3)",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "private",
      description: "Mostrar la respuesta solo a ti (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/imc peso:70 altura:1.75",
    "/imc peso:70 altura:175",
    "/imc peso:70 altura:1.75 private:true",
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const peso = Number(args.find((a) => a.name === "peso")?.value);
      const rawAltura = Number(args.find((a) => a.name === "altura")?.value);
      const isPrivate =
        (args.find((a) => a.name === "private")?.value as
          | boolean
          | undefined) ?? false;

      if (!peso || !rawAltura || peso <= 0 || rawAltura <= 0) {
        return interaction.reply({
          content: "No seas pendejo, peso y altura tienen que ser > 0.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const altura = rawAltura > 3 ? rawAltura / 100 : rawAltura;
      const imc = peso / (altura * altura);
      const range = findRange(imc);
      const ideal = idealWeightRange(altura);

      const embed = new EmbedBuilder()
        .setTitle("🩺 Índice de Masa Corporal")
        .addFields(
          { name: "IMC", value: `\`${imc.toFixed(2)}\``, inline: true },
          {
            name: "Estado",
            value: `\`${range.message}\` ${range.icon}`,
            inline: true,
          },
          {
            name: "Peso ideal",
            value: `\`${ideal.min}–${ideal.max} kg\``,
            inline: true,
          }
        )
        .setColor(range.color as ColorResolvable)
        .setThumbnail(
          "https://es.calcuworld.com/wp-content/uploads/sites/2/2013/02/imc.png"
        )
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

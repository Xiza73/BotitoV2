import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { Jimp } from "jimp";

import config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  colorForCategory,
} from "../../shared/constants/branding";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler, random } from "../../shared/utils/helpers";

const OPTIONS = {
  quantity: "quantity",
  sides: "sides",
  private: "private",
} as const;

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;
const MIN_SIDES = 2;
const MAX_SIDES = 100;

const IMAGE_AVAILABLE_SIDES = [4, 6, 12] as const;
const TILES_PER_ROW = 6;

const composeDiceImage = async (rolls: number[], sides: number) => {
  const repo = config.oldRoot;
  const images = await Promise.all(
    rolls.map((r) => Jimp.read(`${repo}/d${sides}/d${r}.png`))
  );

  const tileWidth = images[0].width;
  const tileHeight = images[0].height;
  const cols = Math.min(images.length, TILES_PER_ROW);
  const rows = Math.ceil(images.length / TILES_PER_ROW);
  const finalImage = new Jimp({
    width: cols * tileWidth,
    height: rows * tileHeight,
  });

  for (let i = 0; i < images.length; i++) {
    const col = i % TILES_PER_ROW;
    const row = Math.floor(i / TILES_PER_ROW);
    finalImage.composite(images[i], col * tileWidth, row * tileHeight);
  }

  return finalImage.getBuffer("image/png");
};

const buildEmbed = (rolls: number[], sides: number) => {
  const total = rolls.reduce((a, b) => a + b, 0);
  const dieLabel = `${rolls.length}d${sides}`;

  const description =
    rolls.length === 1
      ? `Sacaste un **${rolls[0]}** (\`d${sides}\`)`
      : `**${dieLabel}**: ${rolls.join(", ")}\n\n**Total:** ${total}`;

  return new EmbedBuilder()
    .setTitle("🎲 Dados")
    .setDescription(description)
    .setColor(colorForCategory("fun"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const pull: ISlashCommand = {
  name: "roll",
  category: "fun",
  description: "Tira dados (con imagen para d4, d6 y d12)",
  ownerOnly: false,
  options: [
    {
      name: OPTIONS.quantity,
      description: `Cantidad de dados (${MIN_QUANTITY}–${MAX_QUANTITY}, default: 1)`,
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
    {
      name: OPTIONS.sides,
      description: `Cantidad de lados (${MIN_SIDES}–${MAX_SIDES}, default: 6)`,
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
    {
      name: OPTIONS.private,
      description: "Mostrar la respuesta solo a vos (default: público)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: ["/roll", "/roll quantity:3 sides:6", "/roll sides:20"],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const rawQuantity = args.find((a) => a.name === OPTIONS.quantity)
        ?.value as number | undefined;
      const rawSides = args.find((a) => a.name === OPTIONS.sides)?.value as
        | number
        | undefined;
      const isPrivate =
        (args.find((a) => a.name === OPTIONS.private)?.value as
          | boolean
          | undefined) ?? false;

      if (rawQuantity !== undefined && rawQuantity < MIN_QUANTITY) {
        return interaction.reply({
          content: `La cantidad de dados debe ser al menos ${MIN_QUANTITY}.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (rawSides !== undefined && rawSides < MIN_SIDES) {
        return interaction.reply({
          content: `Un dado debe tener al menos ${MIN_SIDES} lados.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const quantity = Math.min(rawQuantity ?? 1, MAX_QUANTITY);
      const sides = Math.min(rawSides ?? 6, MAX_SIDES);

      const rolls: number[] = [];
      for (let i = 0; i < quantity; i++) rolls.push(random(1, sides));

      const embed = buildEmbed(rolls, sides);
      const flags = isPrivate ? MessageFlags.Ephemeral : undefined;

      if ((IMAGE_AVAILABLE_SIDES as readonly number[]).includes(sides)) {
        const buffer = await composeDiceImage(rolls, sides);
        embed.setImage("attachment://dice.png");
        return interaction.reply({
          embeds: [embed],
          files: [{ attachment: buffer, name: "dice.png" }],
          flags,
        });
      }

      return interaction.reply({ embeds: [embed], flags });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

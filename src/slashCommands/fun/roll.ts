import Discord, { CommandInteraction } from "discord.js";
import config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler, random } from "../../shared/utils/helpers";
import Jimp from "jimp";

const OPTIONS = {
  quantity: "quantity",
  sides: "sides",
} as const;

type OPTIONS_TYPES = (typeof OPTIONS)[keyof typeof OPTIONS];

const pull: ISlashCommand = {
  name: "roll",
  category: "fun",
  description: "roll dices",
  ownerOnly: false,
  options: [
    {
      name: OPTIONS.quantity,
      description: "The number of dices to roll",
      type: MoreCommandTypes.NUMBER,
      required: false,
    },
    {
      name: OPTIONS.sides,
      description: "The number of sides of the dice",
      type: MoreCommandTypes.NUMBER,
      required: false,
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: CommandInteraction,
    args: Argument[]
  ) => {
    try {
      const { quantity, sides } = getArgs(args);
      const result = [];
      const existImages = [4, 6, 12];
      const repo = config.oldRoot;
      for (let i = 0; i < quantity; i++) {
        result.push(random(1, sides));
      }
      const embed = new Discord.MessageEmbed()
        .setColor("GOLD")
        .setTitle("Dice Roll")
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      if (existImages.includes(sides)) {
        const images = await Promise.all(
          result.map(async (r) => {
            const image = await Jimp.read(`${repo}/d${sides}/d${r}.png`);
            return image;
          })
        );

        const width =
          (images.length > 6 ? 6 : images.length) * images[0].getWidth();
        const height = Math.ceil(images.length / 6) * images[0].getHeight();
        const finalImage = new Jimp(width, height);
        let x = 0;
        // if image is base image x 6 then go to next line
        let col = 0;
        let row = 0;
        for (const image of images) {
          /* finalImage.composite(image, x, 0);
          x += image.getWidth(); */
          finalImage.composite(image, x, row * image.getHeight());
          x += image.getWidth();
          col++;
          if (col === 6) {
            col = 0;
            row++;
            x = 0;
          }
        }
        const buffer = await finalImage.getBufferAsync(Jimp.MIME_PNG);
        embed.setImage(`attachment://dice.png`);
        interaction.reply({
          embeds: [embed],
          files: [{ attachment: buffer, name: "dice.png" }],
        });
        return;
      } else {
        embed.setDescription(result.join("\n"));
      }

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

const maxQuantity = 20;

const getArgs = (args: Argument[]) => {
  let { quantity, sides } = args!.reduce<
    Partial<Record<OPTIONS_TYPES, string | number | boolean>>
  >(
    (acc, cur) => {
      acc[cur.name as OPTIONS_TYPES] = cur.value;
      return acc;
    },
    { quantity: 1, sides: 6 }
  );
  quantity = Number(quantity);
  sides = Number(sides);
  if (!quantity) quantity = 1;
  if (!sides) sides = 6;
  quantity = quantity > maxQuantity ? maxQuantity : quantity < 1 ? 1 : quantity;
  sides = sides > 100 ? 100 : sides < 1 ? 1 : sides;
  return { quantity, sides };
};

export default pull;

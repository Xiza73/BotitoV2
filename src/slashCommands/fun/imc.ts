import {
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
} from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ApplicationCommandOptionType } from "discord.js";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

type ImcRange = {
  message: string;
  icon: string;
  color: string;
};

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

const pull: ISlashCommand = {
  name: "imc",
  category: "fun",
  description: "Calcula tu IMC",
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
      description: "Altura en metros (o cm si pasás un valor mayor a 3)",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const weight = Number(args.find((a) => a.name === "peso")?.value);
      const rawHeight = Number(args.find((a) => a.name === "altura")?.value);

      if (!weight || !rawHeight || weight <= 0 || rawHeight <= 0) {
        return interaction.reply({
          content: "No seas pendejo, peso y altura tienen que ser > 0.",
          ephemeral: true,
        });
      }

      const height = rawHeight > 3 ? rawHeight / 100 : rawHeight;
      const imcNumber = weight / (height * height);

      let imc: ImcRange = {
        message: "No se pudo calcular",
        icon: "🤔",
        color: "#000000",
      };
      for (const threshold of thresholds) {
        if (imcNumber < threshold) {
          imc = imcData[threshold.toString()]!;
          break;
        }
      }

      const embed = new EmbedBuilder({
        title: "Índice de Masa Corporal  🩺",
        fields: [
          {
            name: "IMC",
            value: `\`${imcNumber.toFixed(2)}\``,
            inline: true,
          },
          {
            name: "Estado",
            value: `\`${imc.message}\` ${imc.icon}`,
            inline: true,
          },
        ],
        thumbnail: {
          url: "https://es.calcuworld.com/wp-content/uploads/sites/2/2013/02/imc.png",
        },
      }).setColor(imc.color as ColorResolvable);

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

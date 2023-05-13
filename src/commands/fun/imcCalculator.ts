import { Client, ColorResolvable, Message, MessageEmbed } from "discord.js";
import { ICommand } from "../../shared/types";

type imcMessage = {
  message: string;
  icon: string;
  color: string;
};

const imcData: {
  [key: string]: imcMessage;
} = {
  "18.5": {
    message: "Bajo peso",
    icon: "🙀",
    color: "#ff0000",
  },
  "24.9": {
    message: "Peso normal",
    icon: "😺",
    color: "#00ff00",
  },
  "29.9": {
    message: "Sobrepeso",
    icon: "😿",
    color: "#ffff00",
  },
  "34.9": {
    message: "Obesidad grado 1",
    icon: "😾",
    color: "#ff0000",
  },
  "39.9": {
    message: "Obesidad grado 2",
    icon: "💀",
    color: "#ff0000",
  },
  "100": {
    message: "Obesidad grado 3",
    icon: "☠️",
    color: "#ff0000",
  },
};

const keys = Object.keys(imcData)
  .sort((a, b) => parseFloat(a) - parseFloat(b))
  .map((key) => parseFloat(key));

const pull: ICommand = {
  name: "imccalculator",
  category: "fun",
  description: "calcula tu imc",
  usage: "<peso> <altura>",
  aliases: ["imc", "imccalc"],
  ownerOnly: false,
  run: async (__: Client, msg: Message, args: string[], _: string) => {
    try {
      if (!args[0]) return msg.channel.send("Falta agregar peso");
      if (!args[1]) return msg.channel.send("Falta agregar altura");
      if (args[0] === "0" || args[1] === "0")
        return msg.channel.send("No seas pendejo");
      const weight = parseFloat(args[0]);
      const preHeight = parseFloat(args[1]);
      const height = preHeight > 3 ? preHeight / 100 : preHeight;
      const imcNumber = weight / (height * height);
      let imc: imcMessage = {
        message: "No se pudo calcular",
        icon: "🤔",
        color: "#000000",
      };

      for (const key of keys) {
        if (imcNumber < key) {
          imc = imcData[key]!;
          break;
        }
      }

      const embed = new MessageEmbed({
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

      await msg.channel.send({ embeds: [embed] });
    } catch (error) {
      msg.channel.send("Algo salio mal :( o te crees pendejo");
    }
  },
};

export default pull;

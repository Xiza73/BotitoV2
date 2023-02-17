import { Client, Message, MessageEmbed } from "discord.js";
import { ICommand } from "../../shared/types";
import { translate, langs } from "../../shared/utils/translator";

const pull: ICommand = {
  name: "translate",
  category: "fun",
  description: "Traducir texto",
  usage: "<text> [[target]]",
  aliases: ["traducir", "traductor", "trad"],
  ownerOnly: false,
  run: async (__: Client, msg: Message, args: string[], _: string) => {
    try {
      if (!args[0])
        return msg.channel.send("Tienes que escribir algo para traducir");
      const preTargetFrom = args[args.length - 2];
      const targetFrom =
        preTargetFrom?.match(/\[(.*)\]/) &&
        langs.includes(preTargetFrom?.match(/\[(.*)\]/)![1])
          ? preTargetFrom.match(/\[(.*)\]/)![1]
          : "auto";
      const preTargetTo = args[args.length - 1];
      const targetTo =
        preTargetTo?.match(/\[(.*)\]/) &&
        langs.includes(preTargetTo?.match(/\[(.*)\]/)![1])
          ? preTargetTo.match(/\[(.*)\]/)![1]
          : "es";
      const text = preTargetFrom?.match(/\[(.*)\]/)
        ? args.slice(0, args.length - 2).join(" ")
        : preTargetTo?.match(/\[(.*)\]/)
        ? args.slice(0, args.length - 1).join(" ")
        : args.join(" ");

      if (!text)
        return msg.channel.send("Tienes que escribir algo para traducir");
      const translated = await translate(text, {
        from: targetFrom,
        to: targetTo,
      });

      const embed = new MessageEmbed({
        title: "Traductor",
        description: `Traduciendo de \`${targetFrom}\` a \`${targetTo}\``,
        fields: [
          {
            name: "Texto original",
            value: text.toLowerCase(),
          },
          {
            name: "Texto traducido",
            value: translated,
          },
        ],
        thumbnail: {
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/2048px-Google_Translate_logo.svg.png",
        },
        color: "RANDOM",
      });
      await msg.channel.send({ embeds: [embed] });
    } catch (error) {
      console.log(error);
      msg.channel.send("Error al traducir");
    }
  },
};

export default pull;

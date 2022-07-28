import { ICommand } from "../../shared/types/types";
import { Client, Message, EmbedBuilder } from "discord.js";

const pull: ICommand = {
  name: "say",
  category: "mod",
  description: "Botito repite lo que dices",
  usage: "<input>",
  aliases: [],
  ownerOnly: false,
  run: async (__: Client, message: Message, args: string[], _: string) => {
    message.delete();

    if (!message.member!.permissions.has("ManageMessages"))
      return message
        .reply("You don't have the required permissions to use this command.")
        .then((m) =>
          setTimeout(() => {
            m.delete();
          }, 5000)
        );

    if (args.length < 0)
      return message.reply("Nothing to say?").then((m) =>
        setTimeout(() => {
          m.delete();
        }, 5000)
      );

    if (args[0].toLowerCase() === "embed") {
      const embed = new EmbedBuilder()
        .setDescription(args.slice(1).join(" "))
        .setColor("White");

      return message.channel.send({ embeds: [embed] });
    } else {
      return message.channel.send(args.join(" "));
    }
  },
};

export default pull;

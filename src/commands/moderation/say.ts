import { ICommand } from "../../shared/types/types";
import { Client, Message, MessageEmbed } from "discord.js";

const pull: ICommand = {
  name: "say",
  category: "moderation",
  description: "Botito repite lo que dices",
  usage: "<input>",
  aliases: [],
  run: (__: Client, message: Message, args: string[], _: string) => {
    message.delete();

    if (!message.member!.hasPermission("MANAGE_MESSAGES"))
      return message
        .reply("You don't have the required permissions to use this command.")
        .then((m) =>
          m.delete({
            timeout: 5000,
          })
        );

    if (args.length < 0)
      return message.reply("Nothing to say?").then((m) =>
        m.delete({
          timeout: 5000,
        })
      );

    if (args[0].toLowerCase() === "embed") {
      const embed = new MessageEmbed()
        .setDescription(args.slice(1).join(" "))
        .setColor("#ffffff");

      return message.channel.send(embed);
    } else {
      return message.channel.send(args.join(" "));
    }
  },
};

export default pull;

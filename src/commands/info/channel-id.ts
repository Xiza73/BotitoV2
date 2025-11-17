import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils";
import ClientDiscord from "../../shared/classes/ClientDiscord";

const pull: ICommand = {
  name: "channel-id",
  category: "info",
  description: "Muestra el id del canal",
  usage: "[canal]",
  aliases: ["cid"],
  ownerOnly: false,
  run: async (
    client: Client<boolean> | ClientDiscord,
    message: Message,
    args: string[],
    _: string
  ) => {
    try {
      if (!args[0]) {
        return message.reply({
          content: `El canal es: <#${message.channel.id}> con id ${message.channel.id}`,
        });
      }

      const channel = client.channels.cache.get(args[0]);

      if (!channel) {
        return message.reply({
          content: `No existe el canal con ese id.`,
        });
      }

      return message.reply({
        content: `El canal es: <#${channel.id}>`,
      });
    } catch (error) {
      errorHandler(message, error);
    }
  },
};

export default pull;

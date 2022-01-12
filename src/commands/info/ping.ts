import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";

const pull: ICommand = {
  name: "ping",
  category: "info",
  usage: null,
  aliases: [],
  description: "Tu ping!",
  run: async (client: Client, message: Message, _: string[]) => {
    const msg = await message.channel.send(`🏓 Pinging....`);

    msg.edit(`🏓 Pong!
        Latency is ${Math.floor(
      msg.createdTimestamp - message.createdTimestamp
    )}ms`);
  },
};

export default pull

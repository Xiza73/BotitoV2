import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types";

const pull: ICommand = {
  name: "ping",
  category: "info",
  usage: null,
  aliases: [],
  description: "Tu ping!",
  ownerOnly: false,
  run: async (___: Client, message: Message<true>, _: string[], __: string) => {
    const msg = await message.channel.send(`🏓 Pinging....`);

    await msg.edit(`🏓 Pong!
        Latency is ${Math.floor(
          msg.createdTimestamp - message.createdTimestamp
        )}ms`);
  },
};

export default pull;

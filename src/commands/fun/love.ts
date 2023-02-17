import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types";

const pull: ICommand = {
  name: "love",
  category: "fun",
  description: "Shipea >w<!",
  usage: "<user1> <user2>",
  aliases: [],
  ownerOnly: false,
  run: async (__: Client, msg: Message, args: string[], _: string) => {
    if (args[1]) {
      msg.delete();
      msg.channel.send(`${args[0]} y ${args[1]} se  quieren, se besan :3 <3`);
    } else {
      msg.channel.send(`Tienes que shippear a dos personas oni-chan >n<`);
    }
  },
};

export default pull;

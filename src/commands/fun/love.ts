import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";

const pull: ICommand = {
  name: "love",
  category: "fun",
  description: "Shipea >w<!",
  usage: "<user1> <user2>",
  aliases: [],
  run: async (__: Client, msg: Message, args: string[]) => {
    if (args[1]) {
      msg
        .delete({ timeout: 1000 })
        .then((msg) =>
          console.log(
            `Deleted message from ${msg.author.username} after 5 seconds`
          )
        )
        .catch(console.error);
      let s = msg.toString();
      let texto = s.split(" ");
      msg.channel.send(`${texto[1]} y ${texto[2]} se  quieren, se besan :3 <3`);
    } else {
      msg.channel.send(`Tienes que shippear a dos personas oni-chan >n<`);
    }
  },
};

export default pull;

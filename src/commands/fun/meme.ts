import { ICommand } from "../../shared/types/types";

import { Client, Message, EmbedBuilder } from "discord.js";
import randomPuppy from "random-puppy";

const pull: ICommand = {
  name: "meme",
  category: "fun",
  description: "Envía un momito",
  usage: "[category]",
  aliases: [],
  ownerOnly: false,
  run: async (__: Client, message: Message, args: string[], _: string) => {
    const subReddits = ["meme", "me_irl", "memes", "wholesomememes"];
    const animeReddits = ["wholesomeanimemes"];

    let random = "";

    if (args[0] === "anime") {
      random = animeReddits[Math.floor(Math.random() * animeReddits.length)];
    } else if (args[0] === "tinder") {
      random = "Tinder";
    } else {
      random = subReddits[Math.floor(Math.random() * subReddits.length)];
    }
    const img = await randomPuppy(random);
    const embed = new EmbedBuilder()
      .setColor("Random")
      .setImage(img)
      .setTitle(`From /r/${random}`)
      .setURL(`https://reddit.com/r/${random}`);

    message.channel.send({ embeds: [embed] });
  },
};

export default pull;

import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";

const pull: ICommand = {
  name: "connect",
  category: "voice",
  description: "Conectarse al canal de voz",
  usage: "<>",
  aliases: ["conn"],
  run: async (__: Client, msg: Message, _: string[], ___: string) => {
    const { voice } = msg.member!;

    if (!voice.channelID) {
      msg.reply("Debes estar en un canal de voz!");
      return;
    }

    voice.channel?.join();
  },
};

export default pull;

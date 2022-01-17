import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";

const pull: ICommand = {
  name: "leave",
  category: "voice",
  description: "Desconectarse del canal de voz",
  usage: "<>",
  aliases: ["quick", "disconnect", "q"],
  run: async (__: Client, msg: Message, _: string[], ___: string) => {
    const { voice } = msg.member!;

    if (!voice.channelID) {
      msg.reply("Debes estar en un canal de voz!");
      return;
    }

    voice.channel?.leave();
  },
};

export default pull;

import { getVoiceConnection } from "@discordjs/voice";
import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types";

const pull: ICommand = {
  name: "leave",
  category: "voice",
  description: "Desconectarse del canal de voz",
  usage: "<>",
  aliases: ["quick", "disconnect", "q"],
  ownerOnly: false,
  run: async (__: Client, msg: Message, _: string[], ___: string) => {
    const { voice } = msg.member!;

    if (!voice.channelId) {
      msg.reply("Debes estar en un canal de voz!");
      return;
    }

    getVoiceConnection(voice.channelId)?.destroy();
  },
};

export default pull;

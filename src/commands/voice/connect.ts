import { joinVoiceChannel } from "@discordjs/voice";
import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";

const pull: ICommand = {
  name: "connect",
  category: "voice",
  description: "Conectarse al canal de voz",
  usage: "<>",
  aliases: ["conn"],
  ownerOnly: false,
  run: async (__: Client, msg: Message, _: string[], ___: string) => {
    const { voice } = msg.member!;
    const { guildId, guild } = msg;

    if (!voice.channelId) {
      msg.reply("Debes estar en un canal de voz!");
      return;
    }

    if (!guildId || !guild?.voiceAdapterCreator) {
      return msg.channel.send("Hubo un error al conectar");
    }

    joinVoiceChannel({
      channelId: voice.channelId,
      guildId: guildId,
      adapterCreator: guild?.voiceAdapterCreator,
    }); //voice.channel?.join()
  },
};

export default pull;

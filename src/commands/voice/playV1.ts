import { Client, Message, StreamDispatcher } from "discord.js";
import { ICommand } from "../../shared/types/types";
import ytdl from "ytdl-core";
import ytSearch from "yt-search";
import _config from "../../config/config";

const videoFinder = async (query: string) => {
  const result = await ytSearch(query);

  return result.videos.length > 1 ? result.videos[0] : null;
};

const streamOptions = { seek: 0, volume: 1 };

const pull: ICommand = {
  name: "playV1",
  category: null,
  description: "Reproduce musiquita",
  usage: "<something>",
  aliases: [],
  run: async (__: Client, msg: Message, args: string[], _: string) => {
    const { voice } = msg.member!;

    if (!voice.channelID) return msg.reply("Debes estar en un canal de voz!");

    if (!args) return msg.reply("play what?");

    try {
      const conn = await voice.channel?.join();
      const res = await videoFinder(args.join(" "));
      if (!res) {
        voice.channel?.leave();
        return msg.channel.send(
          `No se encontraron resultados o no se puede reproducir el audio`
        );
      }
      const stream = ytdl(res.url, { filter: "audioonly" });
      const dispatcher: StreamDispatcher | undefined = conn?.play(
        stream,
        streamOptions
      );
      dispatcher?.on("finish", (_: any) => {
        setTimeout(() => {
          voice.channel?.leave();
        }, 5000);
      });

      await msg.channel.send(`🎶 Reproduciendo: \`${res.title}\` 🎵`);
    } catch (error) {
      msg.channel.send(`Error dispatcher`);
      console.log(error);
      voice.channel?.leave();
    }
  },
};

export default pull;

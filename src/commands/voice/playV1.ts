import { Client, Guild, Message } from "discord.js";
import { ICommand, Song, SongQueue } from "../../shared/types/types";
import ytdl from "ytdl-core";
import ytSearch from "yt-search";
import _config from "../../config/config";

const queue = new Map<string | undefined, SongQueue>();
const streamOptions = { seek: 0, volume: 1 };

const pull: ICommand = {
  name: "playV1",
  category: "voice",
  description: "Reproduce musiquita",
  usage: "<something>",
  aliases: ["p", "skip", "s", "stop", "pause", "resume", "queue", "q"],
  run: async (__: Client, msg: Message, args: string[], cmd: string) => {
    /*
    const voice_channel = msg.member!.voice.channel;
    if (!voice_channel) return msg.reply("Debes estar en un canal de voz!");
 
    const permissions = voice_channel.permissionsFor(msg.client.user!);
    if (!permissions?.has("CONNECT"))
      return msg.channel.send("No cuentas con los permisos correctos");
    if (!permissions?.has("SPEAK"))
      return msg.channel.send("No cuentas con los permisos correctos");
 
    try {
      const server_queue = queue.get(msg.guild?.id);
 
      if (cmd === "play" || cmd === "p") {
        if (!args || args.length === 0) return msg.reply("play what?");
        const song: Song = { title: "", url: "" };
 
        //set song
        if (ytdl.validateURL(args[0])) {
          // si es una url http/https
          const song_info = await ytdl.getInfo(args[0]);
          song.title = song_info.videoDetails.title;
          song.url = song_info.videoDetails.video_url;
        } else {
          const video = await videoFinder(args.join(" "));
          if (!video) return msg.channel.send("No se encontraron resultados");
          song.title = video.title;
          song.url = video.url;
        }
 
        if (!server_queue) {
          const queue_constructor: SongQueue = {
            voice_channel,
            text_channel: msg.channel,
            connection: null,
            songs: [],
          };
 
          queue.set(msg.guild?.id, queue_constructor);
          queue_constructor.songs.push(song);
 
          try {
            queue_constructor.connection = await voice_channel.join();
            player(msg.guild!, queue_constructor.songs[0]);
          } catch (err) {
            queue.delete(msg.guild?.id);
            msg.channel.send(`Error al conectar con el reproductor x.x 🎵`);
            console.log(err);
          }
        } else {
          server_queue.songs.push(song);
          await msg.channel.send(
            `🎶 \`${song.title}\`, fue añadido a la cola de música 🎵`
          );
        }
      } else if (cmd === "skip" || cmd === "s") skipSong(msg, server_queue!);
      else if (cmd === "stop") stopSong(msg, server_queue!);
      else if (cmd === "pause" || cmd === "resume")
        pauseSong(msg, server_queue!);
      else if (cmd === "queue" || cmd === "q") viewQueue(msg, server_queue!);
    } catch (error) {
      msg.channel.send(`Error dispatcher`);
      console.log(error);
      voice_channel?.leave();
    }*/
  },
  ownerOnly: true,
};
/*
const videoFinder = async (query: string) => {
  const result = await ytSearch(query);

  return result.videos.length > 1 ? result.videos[0] : null;
};
const player = async (guild: Guild, song: Song) => {
  const song_queue = queue.get(guild.id);

  if (!song) {
    setTimeout(() => {
      song_queue?.text_channel.send(`No hay más canciones :( bye!`);
      song_queue!.voice_channel.leave();
    }, 5000);
    queue.delete(guild.id);
    return;
  }

  const stream = ytdl(song.url, { filter: "audioonly" });
  song_queue?.connection?.play(stream, streamOptions).on("finish", () => {
    song_queue.songs.shift();
    player(guild, song_queue.songs[0]);
  });

  await song_queue?.text_channel.send(`🎶 Reproduciendo: \`${song.title}\` 🎵`);
};

const skipSong = (msg: Message, server_queue: SongQueue) => {
  if (!msg.member?.voice.channel)
    return msg.channel.send(`Debes estar en el canal de voz!`);
  if (!server_queue) return msg.channel.send(`No hay música en la cola!`);

  server_queue.connection?.dispatcher.end();
};

const stopSong = (msg: Message, server_queue: SongQueue) => {
  if (!msg.member?.voice.channel)
    return msg.channel.send(`Debes estar en el canal de voz!`);

  server_queue.songs = [];
  server_queue.connection?.dispatcher.end();
};

const pauseSong = (msg: Message, server_queue: SongQueue) => {
  if (!msg.member?.voice.channel)
    return msg.channel.send(`Debes estar en el canal de voz!`);

  if (server_queue.connection?.dispatcher.paused) {
    server_queue.connection?.dispatcher.resume();
    msg.channel.send(`Play ▶`);
    return;
  }
  server_queue.connection?.dispatcher.pause();
  msg.channel.send(`Pause ⏸`);
};

const viewQueue = (msg: Message, server_queue: SongQueue) => {
  let message: string = "";
  if (!server_queue) msg.channel.send(`Cola vacía!`);
  server_queue.songs.forEach((s, i) => {
    message += `\n${i + 1}. ${s.title}`;
  });
  msg.channel.send(`Cola de música:${message}`);
};*/

export default pull;

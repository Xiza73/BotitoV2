import {
  GuildTextBasedChannel,
  Message,
  MessageEmbed,
  MessageEmbedOptions,
} from "discord.js";
import { ICommand } from "../../shared/types/types";
import _config from "../../config/config";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import ytdl from "ytdl-core";
const pull: ICommand = {
  name: "play",
  category: "voice",
  description: "Reproduce musiquita",
  usage: "<something>",
  aliases: [
    "p",
    "skip",
    "s",
    "stop",
    "pause",
    "resume",
    "queue",
    "q",
    "volume",
  ],
  ownerOnly: false,
  run: async (
    client: ClientDiscord,
    msg: Message,
    args: string[],
    cmd: string
  ) => {
    const { member, guild, channel } = msg;
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel)
      return msg.reply({ content: "Debes estar en un canal de voz!" });

    if (
      guild?.me?.voice.channelId &&
      voiceChannel.id !== guild.me.voice.channelId
    )
      return msg.reply({
        content: `Ya estoy reproduciendo música en <#${guild.me.voice.channelId}>`,
      });

    try {
      const queue = client.distube.getQueue(voiceChannel);
      if (cmd !== "play" && cmd !== "p" && !queue)
        return msg.reply({ content: "⁉️ Nada reproduciendo" });
      switch (cmd) {
        case "play":
        case "p": {
          if (!args || args.length === 0) return msg.reply("play what?");
          client.distube.play(voiceChannel, args[0], {
            member,
            textChannel: channel as GuildTextBasedChannel,
          });
          return;
        }
        case "volume": {
          if (!args || args.length === 0) return msg.reply("<volume>% pls");
          let volume = parseInt(args[0]);
          if (volume > 100) volume = 100;
          if (volume < 1) volume = 1;
          client.distube.setVolume(voiceChannel, volume);
          return msg.channel.send({
            embeds: [
              new MessageEmbed()
                .setColor("BLUE")
                .setDescription(`📶 Volumen al \`${volume}%\``),
            ],
          });
        }
        case "skip": {
          await queue!.skip();
          return msg.channel.send({ content: "⏭️" });
        }
        case "stop": {
          await queue!.stop();
          return msg.channel.send({ content: "⏹️" });
        }
        case "pause": {
          queue!.pause();
          return msg.channel.send({ content: "⏸️" });
        }
        case "resume": {
          queue!.resume();
          return msg.channel.send({ content: "⏯️" });
        }
        case "queue": {
          const embed: MessageEmbedOptions = {
            color: "BLUE",
            description: `${queue?.songs.map(
              (song, id) =>
                `\n**${id + 1}**. ${song.name} - \`${song.formattedDuration}\``
            )}`,
          };
          return msg.channel.send({ embeds: [embed] });
        }
        default:
          return;
      }
    } catch (err) {
      const errEmbed: MessageEmbedOptions = {
        color: "RED",
        description: `Alert: ${err}`,
      };
      return msg.reply({ embeds: [errEmbed] });
    }
  },
};
export default pull;

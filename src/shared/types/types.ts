import { Client, DMChannel, Message, NewsChannel, TextChannel, VoiceChannel, VoiceConnection } from "discord.js";
import ClientDiscord from "../classes/ClientDiscord";

export type ICommand = {
  name: string;
  category: string | null;
  description: string;
  usage: string | null;
  aliases: string[];
  run: (
    client: Client,
    msg: Message,
    args: string[],
    cmd: string
  ) => Promise<Message | undefined | void>;
};

export type Param = {
  name: string;
  value: string;
};

export type IDate = {
  day: number;
  month: number;
  year: number;
  hours: number;
  minutes: number;
  week: number;
};

export type Song = {
  title: string;
  url: string;
};

export type SongQueue = {
  voice_channel: VoiceChannel,
  text_channel: TextChannel | DMChannel | NewsChannel,
  connection: VoiceConnection | null,
  songs: Song[],
}
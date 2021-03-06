import { VoiceConnection } from "@discordjs/voice";
import {
  DMChannel,
  Message,
  NewsChannel,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import ClientDiscord from "../classes/ClientDiscord";

export type ICommand = {
  name: string;
  category: string | null;
  description: string;
  usage: string | null;
  aliases: string[];
  ownerOnly: boolean;
  run: (
    client: ClientDiscord,
    msg: Message,
    args: string[],
    cmd: string
  // eslint-disable-next-line no-undef
  ) => Promise<Message | undefined | void | NodeJS.Timeout>;
};

export type Param = {
  name: string;
  value: string;
};

export type Week = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Month = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type IDate = {
  day: number;
  month: Month;
  year: number;
  hours: number;
  minutes: number;
  week: Week;
};

export type Song = {
  title: string;
  url: string;
};

export type SongQueue = {
  voice_channel: VoiceChannel;
  text_channel: TextChannel | DMChannel | NewsChannel;
  connection: VoiceConnection | null;
  songs: Song[];
};

export type ClientConfig = {
  botId?: string;
  prefix: string;
  ownerId: string;
};

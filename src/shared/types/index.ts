import { VoiceConnection } from "@discordjs/voice";
import {
  ApplicationCommandDataResolvable,
  ChatInputApplicationCommandData,
  CommandInteraction,
  DMChannel,
  Message,
  MessageApplicationCommandData,
  NewsChannel,
  TextChannel,
  UserApplicationCommandData,
  VoiceChannel,
} from "discord.js";
import ClientDiscord from "../classes/ClientDiscord";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { MoreCommandTypes } from "../constants/commands";

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

export type TypeCommandOption = ApplicationCommandTypes | MoreCommandTypes;

export type Argument = {
  name: string;
  type: TypeCommandOption;
  value?: string | number | boolean;
  args?: {
    name: string;
    type:
      | UserApplicationCommandData
      | MessageApplicationCommandData
      | ChatInputApplicationCommandData;
    value?: string | number | boolean;
  }[];
};

export type SlashCommandsOptions = {
  name: string;
  description: string;
  options?: SlashCommandsOptions[];
  type?: TypeCommandOption;
  required?: boolean;
};

/* UserApplicationCommandData
MessageApplicationCommandData
ChatInputApplicationCommandData */
/* RULES */
// SUB_COMMANDS can only coexist with other SUB_COMMANDS at the same level
// SUB_COMMANDS can only exist at the top level of a command
export type ISlashCommand = {
  name: string;
  category: string | null;
  description: string;
  options?: SlashCommandsOptions[];
  ownerOnly: boolean;
  run: (
    client: ClientDiscord,
    interaction: CommandInteraction,
    args: Argument[]
    // eslint-disable-next-line no-undef
  ) => Promise<Message | undefined | void | NodeJS.Timeout>;
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

export type CumUser = {
  name: string;
  birthdayDay?: number | null;
  discordId: string;
  birthdayMonth?: Month;
};

export type CumData = {
  [key: string]: CumUser[];
};

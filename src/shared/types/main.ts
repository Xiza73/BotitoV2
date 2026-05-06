import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  Message,
  MessageApplicationCommandData,
  UserApplicationCommandData,
} from "discord.js";
import ClientDiscord from "../classes/ClientDiscord";
import { MoreCommandTypes } from "../constants/commands";

export type TypeCommandOption = ApplicationCommandType | MoreCommandTypes;

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
    interaction: ChatInputCommandInteraction,
    args: Argument[],
  ) => Promise<unknown>;
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

export type ClientConfig = {
  botId?: string;
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

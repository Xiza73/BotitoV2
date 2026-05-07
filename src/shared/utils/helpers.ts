import {
  Channel,
  Message,
  EmbedBuilder,
  MessageCreateOptions,
  MessagePayload,
  CommandInteraction,
} from "discord.js";
import ClientDiscord from "../classes/ClientDiscord";
import { IDate, Week, Month } from "../types";
import _config from "./../../config";

export const logger = (...msgs: any[]) => console.log(...msgs);

export const random = (min: number, max: number) => {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
};

export const capitalize = (str: String) => {
  const arr = str.split(" ");

  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
  }

  return arr.join(" ");
};

export const setParams = (params: {
  [key: string]: string | number | boolean;
}) => {
  let param = "?";
  Object.keys(params).forEach((p) => {
    param += p + "=" + params[p] + "&";
  });
  param = param.substring(0, param.length - 1);
  return param;
};

export const dateToUTC5 = (date: Date) => {
  let day, hours, week;

  if (date.getUTCHours() < 5) {
    week = date.getDay() - 1;
    day = date.getUTCDate() - 1;
    hours = date.getUTCHours() + 19;
  } else {
    week = date.getDay();
    day = date.getUTCDate();
    hours = date.getUTCHours() - 5;
  }

  const utc5: IDate = {
    day,
    month: (date.getUTCMonth() + 1) as Month,
    year: date.getUTCFullYear(),
    hours,
    minutes: date.getUTCMinutes(),
    week: week as Week,
  };

  return utc5;
};

export const channelSender = (
  client: ClientDiscord,
  idChannel: string,
  msg: string | MessagePayload | MessageCreateOptions
) => {
  const channel: Channel | undefined = client.channels.cache.find(
    (channel) => channel.id === idChannel
  );
  if (!channel || !channel.isTextBased() || !channel.isSendable()) return;

  channel.send(msg);
};

/**
 * Returns a shuffled COPY of the input array — the original is untouched.
 * Uses Fisher-Yates so the distribution is uniform.
 */
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const ownerSender = async (
  client: ClientDiscord,
  msg: string | EmbedBuilder | MessagePayload | MessageCreateOptions,
  isEmbed?: boolean
) => {
  const user = await client.users.fetch(_config.ownerId, {
    cache: false,
  });

  if (!user) return;

  if (isEmbed) {
    return await user.send({ embeds: [msg as EmbedBuilder] });
  }

  return await user.send(msg as string);
};

export const mentionUser = (id: string) => {
  return `**<@${id}>**`;
};

export const errorHandler = (
  sender: Message | CommandInteraction,
  error: any,
  msg: string = "Error con el comando"
) => {
  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle(`Error ${error?.response?.data?.statusCode || "☠️"}`)
    .setFields([
      {
        name: msg,
        value: `El servidor dice: ${
          error?.response?.data?.message ||
          error?.message ||
          error ||
          "No hay mensaje de error."
        }`,
      },
    ]);
  if (!sender.channel?.isSendable()) return;
  return sender.channel.send({ embeds: [embed] });
};

export const rangeHandler = (
  value: number,
  min: number,
  max: number
): number => {
  if (value > max) return max;
  if (value < min) return min;
  return value;
};

/**
 * Formats a duration in seconds into a compact human-readable string.
 * Examples: 45s, 5m 30s, 2h 15m, 3d 4h 0m
 */
export const formatUptime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0s";
  const totalSec = Math.floor(seconds);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

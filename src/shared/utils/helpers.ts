import {
  AnyChannel,
  Message,
  MessageEmbed,
  MessageOptions,
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
  msg: string | MessagePayload | MessageOptions
) => {
  const channel: AnyChannel | undefined = client.channels.cache.find(
    (channel) => channel.id === idChannel
  );
  if (!channel || !channel?.isText()) return;

  channel.send(msg);
};

export const shuffle = <T>(array: T[]): T[] => {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

export const ownerSender = async (
  client: ClientDiscord,
  msg: string | MessageEmbed | MessagePayload | MessageOptions,
  isEmbed?: boolean
) => {
  const user = await client.users.fetch(_config.ownerId, {
    cache: false,
  });

  if (!user) return;

  if (isEmbed) {
    return await user.send({ embeds: [msg as MessageEmbed] });
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
  const embed = new MessageEmbed()
    .setColor("RED")
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
  return sender.channel?.send({ embeds: [embed] });
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

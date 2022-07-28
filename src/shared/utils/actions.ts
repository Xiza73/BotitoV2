import { Message, MessageEmbed } from "discord.js";
import { dateToUTC5, random } from "./helpers";
import client from "../../discord";
import { reminder } from "./birthdayReminder";
import {
  thursdayEmbedController,
  goodMorning,
  fridayEmbedController,
} from "./goodMorning";
import { IDate } from "../types/types";
import calendar from "../constants/calendar";

export const action = (comando: string, msg: Message): any => {
  // COMANDOS
  const comandos: any = {
    role: async function () {
      const role = msg.member!.roles.highest;
      if (role.name === "Staff" || role.name === "Admin") {
        msg.channel.send(`Role: ${role.name} ⭐`);
        return;
      }
      msg.channel.send(`Role: ${role.name}`);
    },
    suma: function () {
      let error = false;
      let suma = 0;
      const s = msg.toString();
      const texto = s.split(" ");
      try {
        for (let i = 1; i < texto.length; i++) {
          if (Number.isNaN(parseFloat(texto[i]))) {
            error = true;
            break;
          } else {
            suma += parseFloat(texto[i]);
          }
        }
        if (error) {
          msg.channel.send(`Error, parámetro no aceptado`);
        } else {
          msg.channel.send(`Suma: ${suma}`);
        }
      } catch (error) {
        msg.channel.send(`Error, parámetro no aceptado`);
      }
    },
    time: function () {
      const today = dateToUTC5(new Date());
      const format = `${calendar.weekdays[today.week]} - ${
        today.day < 10 ? "0" + today.day : today.day
      }/${today.month < 10 ? "0" + today.month : today.month}/${today.year} - ${
        today.hours
      }:${today.minutes}`;
      msg.channel.send(format);
    },
    cum: function () {
      reminder(client);
    },
    morning: function () {
      goodMorning(client);
    },
    jueves: function () {
      const { week }: IDate = dateToUTC5(new Date());
      msg.channel.send({ embeds: [thursdayEmbedController(week)!] });
    },
    viernes: function () {
      const { week }: IDate = dateToUTC5(new Date());
      msg.channel.send({ embeds: [fridayEmbedController(week)!] });
    },
    hola: function () {
      msg.channel.send(`Hola ${msg.member!.user} ^u^`);
    },
    id: function () {
      const userId = msg.mentions.users.map((x) => x.id);
      const username = msg.mentions.users.map((x) => x.username);
      if (username[0]) {
        msg.channel.send(
          `${username[0]} tu id es: ${userId} y tu dirección ip: ${random(
            172,
            199
          )}.${random(210, 255)}.${random(51, 192)}.${random(82, 199)} 🕵`
        );
        return;
      }
      msg.channel.send(
        `${msg.member!.user} tu id es: ${
          msg.member!.id
        } y tu dirección ip: ${random(172, 199)}.${random(210, 255)}.${random(
          51,
          192
        )}.${random(82, 199)} 🕵`
      );
    },
    mention: function () {
      let res = "";
      msg.mentions.users.forEach((x) => {
        res += `${x.username} `;
      });
      msg.channel.send(res);
    },
    // EMBEDS
    embed1: function () {
      const exampleEmbed = new MessageEmbed({
        color: 0x0099ff,
        title: "Some title",
        url: "https://discord.js.org",
        author: {
          name: "Some name",
          icon_url: "https://i.imgur.com/wSTFkRM.png",
          url: "https://discord.js.org",
        },
        description: "Some description here",
        thumbnail: {
          url: "https://i.imgur.com/wSTFkRM.png",
        },
        fields: [
          {
            name: "Regular field title",
            value: "Some value here",
          },
          {
            name: "\u200b",
            value: "\u200b",
            inline: false,
          },
          {
            name: "Inline field title",
            value: "Some value here",
            inline: true,
          },
          {
            name: "Inline field title",
            value: "Some value here",
            inline: true,
          },
          {
            name: "Inline field title",
            value: "Some value here",
            inline: true,
          },
        ],
        image: {
          url: "https://i.imgur.com/wSTFkRM.png",
        },
        timestamp: new Date(),
        footer: {
          text: "Some footer text here",
          icon_url: "https://i.imgur.com/wSTFkRM.png",
        },
      });

      msg.channel.send({ embeds: [exampleEmbed] });
    },
    examplembed: function () {
      const embed = new MessageEmbed()
        .setTitle("Título")
        .setColor(0x5e9de4) // color barra izquierda
        .setDescription("descipción")
        .addFields([
          {
            name: "Field en una línea",
            value: "Contenido del field",
          },
          {
            name: "Field en media línea",
            value: "content1",
            inline: false,
          },
          {
            name: "Field en media línea",
            value: "content2",
            inline: false,
          },
        ])
        .setAuthor({
          name: msg.member!.displayName,
          iconURL: msg.author.avatarURL()!,
        })
        // .setAuthor(client.user.username, client.user.avatarURL()) //bot
        .setThumbnail("https://media.giphy.com/media/euMGM3uD3NHva/giphy.gif")
        .setImage("https://media.giphy.com/media/euMGM3uD3NHva/giphy.gif")
        .setFooter({
          text: `Solicitado por: ${msg.member!.displayName}`,
          iconURL: msg.author.avatarURL()!,
        })
        .setTimestamp();

      msg.channel.send({ embeds: [embed] });
    },
    /*
      GUÍA COMANDOS
          msg.reply('message') -> @user, message
          message.channel.send("message") -> message
      */
  };

  if (typeof comandos[comando] !== "function") {
    return "default";
  }

  return comandos[comando]();
};

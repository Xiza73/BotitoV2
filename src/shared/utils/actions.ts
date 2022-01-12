import { Message, MessageEmbed } from "discord.js";
import _config from "../../config/config";
import { random } from "./helpers";
import client from "../../discord";

const estrellitas = [
  "0.png",
  "1.gif",
  "2.gif",
  "3.gif",
  "4.png",
  "1.gif",
  "3.gif",
];

export const action = (comando: string, msg: Message): any => {
  //COMANDOS
  const comandos: any = {
    role: async function () {
      let s = msg.toString();
      let texto = s.split(" ");
      if (!texto[1]) {
        const userId = msg.member?.id;

        const role = msg.member!.roles.highest;
        if (role.name === "Admin") {
          console.log("admin");
          return;
        }
        console.log("wtf");
        return;
      }
      let mentions = msg.mentions.users.map((x) => x.id);
      if (!mentions) msg.channel.send(`Mencione un usuario!`);
      const user = await client.users.fetch(mentions[0])
      msg.channel.send(`Suma: ${user}`);
    },
    suma: function () {
      let error = false;
      let suma = 0;
      let s = msg.toString();
      let texto = s.split(" ");
      for (let i = 1; i < texto.length; i++) {
        if (Number.isNaN(parseFloat(texto[i]))) {
          error = true;
          break;
        } else {
          console.log("wtf xd");
          suma += parseFloat(texto[i]);
        }
      }
      if (error) {
        msg.channel.send(`Error, parámetro no aceptado`);
      } else {
        msg.channel.send(`Suma: ${suma}`);
      }
    },

    attack: function () {
      let s = msg.toString();
      let texto = s.split(" ");
      msg.channel.send(`${texto[1]} muere rechuchatumare >:v`);
    },
    morning: function () {
      const exampleEmbed = {
        color: 0xecff07,
        title: "Buenos días estrellitas!",
        description: `La tierra les dice holaaaaa`,
        thumbnail: {
          url: `${_config.photodb}/willy.jpg`,
        },
        image: {
          url: `${_config.photodb}/estrellitas/${estrellitas[random(0, 4)]}`,
        },
        timestamp: new Date(),
      };

      msg.channel.send({ embed: exampleEmbed });
    },
    jueves: function () {
      const exampleEmbed = {
        color: 0xf14d00,
        title: "Feliz Jueves!",
        image: {
          url: `${_config.photodb}/asuka.gif`,
        },
        timestamp: new Date(),
      };

      msg.channel.send({ embed: exampleEmbed });
    },
    viernes: function () {
      const exampleEmbed = {
        color: 0x0099ff,
        title: "PREPARATE LA PUTA QUE TE RE PARIÓ",
        description: `**Porque Los viernes de la jungla serán a todo ojete**
            todo ojete todo ojete; ojete, ojete, ojete
            **Para vivir una noche con las mejores putas de la zona**
            No te la podes perder hijo de re mil, porque si no estás allí; andate a la concha de la lora
            **Te esperamos para que vivas una noche de la puta madre**`,
        image: {
          url: `${_config.photodb}/viernes.gif`,
        },
        timestamp: new Date(),
      };

      msg.channel.send({ embed: exampleEmbed });
    },
    hola: function () {
      msg.channel.send(`Hola ${msg.member!.user} ^u^`);
    },
    id: function () {
      let userId = msg.mentions.users.map((x) => x.id);
      let username = msg.mentions.users.map((x) => x.username);
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
      console.log(msg.mentions.users);
    },
    //EMBEDS
    embed1: function () {
      const exampleEmbed = {
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
      };

      msg.channel.send({ embed: exampleEmbed });
    },
    examplembed: function () {
      const embed = new MessageEmbed()
        .setTitle("Título")
        .setColor(0x5e9de4) //color barra izquierda
        .setDescription("descipción")
        .addField("Field en una línea", "Contenido del field")
        .addField("Field en media línea", "content1", true)
        .addField("Field en media línea", "content2", true)
        .setAuthor(msg.member!.displayName, msg.author.avatarURL()!) //apodo
        //.setAuthor(client.user.username, client.user.avatarURL()) //bot
        .setThumbnail("https://media.giphy.com/media/euMGM3uD3NHva/giphy.gif")
        .setImage("https://media.giphy.com/media/euMGM3uD3NHva/giphy.gif")
        .setFooter(
          `Solicitado por: ${msg.member!.displayName}`,
          msg.author.avatarURL()!
        )
        .setTimestamp();

      msg.channel.send(embed);
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

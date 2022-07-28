import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";
import Death from "death-games";
import { random } from "../../shared/utils/helpers";

const change = (turno: number, ultimo: number, i: number) => {
  turno += i;
  if (turno < 0) turno = ultimo;
  if (turno > ultimo) turno = 0;
  return turno;
};

const pull: ICommand = {
  name: "hangman",
  category: "fun",
  description: `El clásico juego de ahorcado.
  **Modo de juego 1:** Mencionas a los demás jugadores y tú escoges la palabra mediante un dm a Botito.
  **Modo de juego 2:** Te incluyes entre las menciones y Botito escoge una palabra al azar para que todos jueguen.`,
  usage: "<player>(+)",
  aliases: [],
  ownerOnly: false,
  run: async (__: Client, message: Message, _: string[], ___: string) => {
    const author = [message.author.id];
    let turn = 0;
    const mencion = message.mentions.users.map((x) => x.id);
    const players = message.mentions.users.map((x) => x.username);
    const jugadores = author.concat(mencion); // Un array donde el primer elemento es el autor del mensaje, los demás los usuarios mencionados
    const img =
      "https://res.cloudinary.com/dnbgxu47a/image/upload/v1612912935/ahorcado";

    if (!mencion.length)
      return message.channel.send("Tienes que mencionar mínimo a una persona!");
    if (message.mentions.users.map((x) => x.bot).some((x) => x))
      return message.channel.send("No puedes mencionar a un bot!");
    let palabra = "a";
    if (mencion.includes(message.author.id)) {
      const json = require("../../multimedia/palabras.json");
      palabra = json[random(0, json.length - 1)].nombre;
    } else {
      const channel = await message.author.createDM(); // Puedes definir un canal a donde se le preguntará la palabra al usuario
      channel.send("Elige tu palabra");

      await channel
        .awaitMessages({
          max: 1,
          time: 20000,
          errors: ["time"],
          filter: (m: Message): boolean =>
            m.author.id === message.author.id &&
            m.content.replace(/[^A-Za-z0-9áéíóú\u00f1]/g, "").length !== null,
        })
        .then((collected) => {
          palabra = collected
            .first()!
            .content.replace(/[^A-Za-z0-9áéíóú\u00f1 ]/g, "");
        })
        .catch(() => channel.send("Tiempo agotado!"));
      if (!palabra) return;
    }

    const ahorcado = new Death.Hangman(palabra, {
      jugadores,
      lowerCase: true,
      vidas: 7,
    });

    ahorcado.on("end", (game: any) => {
      turn = change(turn, players.length - 1, -1);
      let s = "";
      let vida = 0;
      if (game.winned) {
        // Si el juego ha terminado y se ha descubierto toda la frase
        s +=
          "El juego ha finalizado! La palabra era: **" +
          game.palabra +
          "**\n" +
          "Descubierto por: **" +
          players[turn] +
          "**" +
          "```" +
          game.ascii.join(" ") +
          "```";
        vida = 7;
      } else {
        // Si ha terminado pero no han descubierto la frase
        s +=
          "Han perdido! La palabra era: **" +
          game.palabra +
          "**\n" +
          "Último error: **" +
          players[turn] +
          "**" +
          "```\n" +
          game.ascii.join(" ") +
          "```";
      }
      const emb = {
        color: 0x0099ff,
        title: `Ahorcado`,
        description: s,
        image: {
          url: `${img}/${vida}.png`,
        },
      };
      message.channel.send({ embeds: [emb] });
    });

    const e = {
      color: 0x0099ff,
      title: `Ahorcado`,
      description:
        "```\n" +
        ahorcado.game.ascii.join(" ") +
        "```**Empieza " +
        players[turn] +
        "**",
    };
    turn = change(turn, players.length - 1, 1);
    message.channel.send({ embeds: [e] });

    const colector = message.channel.createMessageCollector({
      filter: (msg) =>
        msg.author.id === ahorcado.game.turno &&
        /[A-Za-z0-9áéíóú\u00f1]/.test(msg.content) &&
        msg.content.length === 1,
    });

    colector.on("collect", (msg) => {
      const encontrado = ahorcado.find(msg.content);
      let s = "";

      if (ahorcado.game.ended) {
        colector.stop();
        return;
      }

      if (!encontrado) {
        if (ahorcado.game.ascii.includes(msg.content)) {
          s +=
            '- La letra "' + msg.content + '" ya se encuentra en la palabra!';
        } else {
          s +=
            "- Vaya! Parece que la letra " +
            msg.content +
            " no se encontraba en la palabra!";
        }
        s +=
          "\nLetras incorrectas: **[" +
          ahorcado.game.letrasIncorrectas.join(", ") +
          "]**";
      }

      s +=
        "```\n" +
        ahorcado.game.ascii.join(" ") +
        "\n```" +
        "**Turno de " +
        players[turn] +
        "**\nIntentos restantes: **" +
        ahorcado.game.vidas +
        "**";

      const myEmbed = {
        color: 0x0099ff,
        title: `Ahorcado`,
        description: s,
        image: {
          url: `${img}/${ahorcado.game.vidas}.png`,
        },
      };
      turn = change(turn, players.length - 1, 1);
      message.channel.send({ embeds: [myEmbed] });
    });
  },
};

export default pull;

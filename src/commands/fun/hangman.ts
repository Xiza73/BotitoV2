import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";
import Death from "death-games";
import { random } from "../../shared/utils/helpers";
import words from "../../shared/data/words";
import _config from "../../config";

const { photoRoot } = _config;

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
  aliases: ["ahorcado"],
  ownerOnly: false,
  run: async (__: Client, message: Message, _: string[], ___: string) => {
    const author = [message.author.id];
    let turn = 0;
    const lifes = 7;
    const mentions = message.mentions.users.map((x) => x.id);
    const users = message.mentions.users.map((x) => x.username);
    const players = author.concat(mentions); // Un array donde el primer elemento es el autor del mensaje, los demás los usuarios mencionados
    const img =
      "https://res.cloudinary.com/dnbgxu47a/image/upload/v1612912935/ahorcado";

    if (!mentions.length)
      return message.channel.send("Tienes que mencionar mínimo a una persona!");
    if (message.mentions.users.map((x) => x.bot).some((x) => x))
      return message.channel.send("No puedes mencionar a un bot!");
    let word = "a";
    if (mentions.includes(message.author.id)) {
      // Si el autor del mensaje está entre los mencionados, Botito escoge una palabra al azar
      word = words[random(0, words.length - 1)].nombre;
      // word = "centímetro"; // Para pruebas
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
            m.content.replace(/[^A-Za-záéíóú\u00f1]/g, "").length !== null,
        })
        .then((collected) => {
          word = collected
            .first()!
            .content.replace(/[^A-Za-záéíóú\u00f1]/g, "");
        })
        .catch(() => channel.send("Tiempo agotado!"));
      if (!word) return;
    }

    const hangman = new Death.Hangman(word, {
      jugadores: players,
      lowerCase: true,
      vidas: lifes,
    });

    hangman.on("end", (game: any) => {
      turn = change(turn, users.length - 1, -1);
      let s = "";
      let vida = 0;
      if (game.winned) {
        // Si el juego ha terminado y se ha descubierto toda la frase
        s +=
          "El juego ha finalizado! La palabra era: **" +
          game.palabra +
          "**\n" +
          "Descubierto por: **" +
          users[turn] +
          "**" +
          "```" +
          game.ascii.join(" ") +
          "```";
        vida = lifes;
      } else {
        // Si ha terminado pero no han descubierto la frase
        s +=
          "Han perdido! La palabra era: **" +
          game.palabra +
          "**\n" +
          "Último error: **" +
          users[turn] +
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
          url: vida
            ? `${img}/${vida}.png`
            : `${photoRoot}/hangman/${random(0, 2)}.gif`,
        },
      };
      message.channel.send({ embeds: [emb] });
    });

    const firstMessage = {
      color: 0x0099ff,
      title: `Ahorcado`,
      description:
        "```\n" +
        hangman.game.ascii.join(" ") +
        "```**Empieza " +
        users[turn] +
        "**",
    };
    turn = change(turn, users.length - 1, 1);
    message.channel.send({ embeds: [firstMessage] });

    const colector = message.channel.createMessageCollector({
      filter: (msg) =>
        msg.author.id === hangman.game.turno &&
        /[A-Za-záéíóú\u00f1]/.test(msg.content),
      // && msg.content.length === 1,
    });

    colector.on("collect", (msg) => {
      let encontrado: any = false;
      if (msg.content.length > 1) {
        if (word === msg.content)
          for (let i = 0; i < word.length; i++)
            if (!hangman.game.ascii.includes(word[i])) hangman.find(word[i]);
      } else encontrado = hangman.find(msg.content);

      let details = "";

      if (hangman.game.ended) return colector.stop();

      if (!encontrado) {
        if (hangman.game.ascii.includes(msg.content)) {
          details +=
            '- La letra "' + msg.content + '" ya se encuentra en la palabra!';
        } else {
          details += "- Vaya! Parece que la ";
          details +=
            msg.content.length > 1
              ? "palabra " + "**" + msg.content + "**" + " no es correcta!"
              : "letra " +
                "**" +
                msg.content +
                "**" +
                " no se encontraba en la palabra!";
        }
      }

      details +=
        "```\n" +
        hangman.game.ascii.join(" ") +
        "\n```" +
        "**Turno de " +
        users[turn] +
        "**\nIntentos restantes: **" +
        hangman.game.vidas +
        "**" +
        "\nLetras incorrectas: **[" +
        hangman.game.letrasIncorrectas.join(", ") +
        "]**";

      const myEmbed = {
        color: 0x0099ff,
        title: `Ahorcado`,
        description: details,
        image: {
          url: `${img}/${hangman.game.vidas}.png`,
        },
      };
      turn = change(turn, users.length - 1, 1);
      message.channel.send({ embeds: [myEmbed] });
    });
  },
};

export default pull;

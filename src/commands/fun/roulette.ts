import { Client, Message, MessageEmbedOptions } from "discord.js";
import { ICommand } from "../../shared/types/types";
import { random as getRandom } from "../../shared/utils/helpers";

const pull: ICommand = {
  name: "roulette",
  category: "fun",
  description: "Juego de la Ruleta Rusa",
  usage: "<player>(+) (Excepto tú)",
  aliases: [],
  ownerOnly: false,
  run: async (__: Client, message: Message, _: string[], ___: string) => {
    const Death = require("death-games");

    let author = [message.author.id]; //Hacemos que el jugador N.1 siempre sea el autor del mensaje
    let menciones = message.mentions.users.map((x) => x.id); //Obtenemos las ID's de las personas mencionadas
    let jugadores = author.concat(menciones); //Juntamos ambos arrays en uno mismo
    let alive = [
      " ajustó bien el anubis pero sigue con nosotros.",
      " nos acompañará una ronda más, te salvaste lagarto.",
      " ha retado a Dios y salió ileso.",
      " aún conserva la respiración.",
      " está muerto de ganas de seguir jugando.",
      " no manchó a los demás con sangre pero sí sus pantalones.",
      " se aferra a la vida como a la castidad.",
      " se ha salvado!",
    ];

    if (message.mentions.users.map((x) => x.bot).some((x) => x))
      return message.channel.send("No puedes mencionar a un bot!");

    if (menciones.includes(message.author.id)) jugadores = menciones;

    const ruleta = new Death.Roulette({ jugadores: jugadores }); //Creamos el juego con el array de ID's de los jugadores, si no hay mencionados sólo juega el autor del mensaje

    message.channel.send(
      "Empieza " +
        message.author.toString() +
        '\nEscribe "roll" en el chat para probar suerte\n'
    );

    /*const colector = message.channel.createMessageCollector(msg => ruleta.game.turno == msg.author.id && !isNaN(msg.content)) */
    const colector = message.channel.createMessageCollector({
      filter: (msg) =>
        ruleta.game.turno === msg.author.id &&
        msg.content.toLowerCase() === "roll",
    });

    colector.on("collect", (msg) => {
      /*if(!Number.isSafeInteger(+(msg.content))) return msg.reply("Necesitas introducir un número más pequeño!")*/ //Si el número es excesivamente grande
      let roll = getRandom(1, 5);

      //let muertoXD = ruleta.elegir(msg.content)
      let muertoXD = ruleta.elegir(roll);
      //Elegimos el número de veces a girar el tambor del revólver
      if (muertoXD) {
        const e: MessageEmbedOptions = {
          color: /*0x0099ff*/ "RANDOM",
          title: `Los soplones, pum pum pum, al agua!`,
          description: msg.author.toString() + " ha muerto! Se acabó la ronda!",
          image: {
            url: `https://res.cloudinary.com/dnbgxu47a/image/upload/v1612981070/roulette/${getRandom(
              1,
              5
            )}.gif`,
          },
        };
        message.channel.send({ embeds: [e] });
        colector.stop();
        return;
      } else {
        message.channel.send(
          msg.author.toString() +
            alive[getRandom(0, alive.length - 1)] +
            "\nTurno de " +
            message
              .guild!.members.cache.get(ruleta.game.turno)!
              .user.toString() +
            '\nEscribe "roll" en el chat para probar suerte\n' +
            "Posición actual: " +
            ruleta.game.posicion /*+", Bala: "+ruleta.game.bala*/
        );
      }
    });
  },
};

export default pull;

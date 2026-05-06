import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Death from "death-games";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ApplicationCommandOptionType } from "discord.js";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler, random as getRandom } from "../../shared/utils/helpers";

const ALIVE_MSGS = [
  " ajustó bien el anubis pero sigue con nosotros.",
  " nos acompañará una ronda más, te salvaste lagarto.",
  " ha retado a Dios y salió ileso.",
  " aún conserva la respiración.",
  " está muerto de ganas de seguir jugando.",
  " no manchó a los demás con sangre pero sí sus pantalones.",
  " se aferra a la vida como a la castidad.",
  " se ha salvado!",
];

const pull: ISlashCommand = {
  name: "ruleta",
  category: "fun",
  description: "Ruleta rusa. Cada jugador escribe `roll` cuando es su turno.",
  ownerOnly: false,
  options: [
    {
      name: "player2",
      description: "Segundo jugador (obligatorio)",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "player3",
      description: "Tercer jugador",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
    {
      name: "player4",
      description: "Cuarto jugador",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
    {
      name: "player5",
      description: "Quinto jugador",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      if (!interaction.channel?.isTextBased() || !interaction.channel.isSendable()) {
        return interaction.reply({
          content: "Este canal no soporta el juego.",
          ephemeral: true,
        });
      }
      const channel = interaction.channel;

      const playerIds: string[] = [interaction.user.id];
      for (const optName of ["player2", "player3", "player4", "player5"]) {
        const id = args.find((a) => a.name === optName)?.value as
          | string
          | undefined;
        if (id) playerIds.push(id);
      }

      const users = await Promise.all(
        playerIds.map((id) => client.users.fetch(id))
      );
      if (users.some((u) => u.bot)) {
        return interaction.reply({
          content: "No podés meter bots.",
          ephemeral: true,
        });
      }

      const ruleta = new Death.Roulette({ jugadores: playerIds });

      await interaction.reply({
        content:
          `Empieza ${interaction.user}\n` +
          `Escribe \`roll\` en el chat para probar suerte`,
      });

      const collector = channel.createMessageCollector({
        filter: (msg) =>
          ruleta.game.turno === msg.author.id &&
          msg.content.toLowerCase() === "roll",
      });

      collector.on("collect", async (msg) => {
        const roll = getRandom(1, 5);
        const dead = ruleta.elegir(roll);

        if (dead) {
          const e = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Los soplones, pum pum pum, al agua!")
            .setDescription(
              msg.author.toString() + " ha muerto! Se acabó la ronda!"
            )
            .setImage(
              `https://res.cloudinary.com/dnbgxu47a/image/upload/v1612981070/roulette/${getRandom(1, 5)}.gif`
            );
          await channel.send({ embeds: [e] });
          collector.stop();
          return;
        }

        const nextUser = users.find((u) => u.id === ruleta.game.turno);
        await channel.send(
          msg.author.toString() +
            ALIVE_MSGS[getRandom(0, ALIVE_MSGS.length - 1)] +
            "\nTurno de " +
            (nextUser?.toString() ?? "?") +
            "\nEscribe `roll` en el chat para probar suerte\n" +
            "Posición actual: " +
            ruleta.game.posicion
        );
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

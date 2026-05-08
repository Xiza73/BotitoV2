import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  User,
} from "discord.js";
import Death from "death-games";

import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  colorForCategory,
} from "../../shared/constants/branding";
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

// Mod-red — signal of death/game-over, intentional deviation from fun yellow
// (same logic as /imc keeping its data-driven status colors).
const DEATH_COLOR = 0xed4245;

// 5 min of silence → game gets cleaned up so a forgotten roulette doesn't hang
// the channel with a dangling collector.
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

const buildKickoffEmbed = (users: User[]) => {
  const isSolo = users.length === 1;
  const playersList = users.map((u, i) => `${i + 1}. <@${u.id}>`).join("\n");
  const description = isSolo
    ? `<@${users[0].id}> juega solo — escribí \`roll\` cuando estés listo.`
    : `Empieza <@${users[0].id}> — escribí \`roll\` en el chat cuando sea tu turno.`;

  return new EmbedBuilder()
    .setTitle("🔫 Ruleta rusa")
    .setDescription(description)
    .setColor(colorForCategory("fun"))
    .addFields({
      name: isSolo ? "👤 Jugador" : "👥 Jugadores",
      value: playersList,
    })
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const buildAliveEmbed = (
  rollerMention: string,
  aliveMsg: string,
  nextUserMention: string | null,
  position: number
) => {
  const lines = [
    `${rollerMention}${aliveMsg}`,
    nextUserMention ? `Turno de ${nextUserMention}` : null,
    `Escribí \`roll\` para probar suerte`,
    `Posición actual: **${position}**`,
  ].filter((s): s is string => Boolean(s));

  return new EmbedBuilder()
    .setDescription(lines.join("\n"))
    .setColor(colorForCategory("fun"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const buildDeathEmbed = (deadUserMention: string) =>
  new EmbedBuilder()
    .setTitle("💀 Los soplones, pum pum pum, al agua!")
    .setDescription(`${deadUserMention} ha muerto! Se acabó la ronda!`)
    .setColor(DEATH_COLOR)
    .setImage(
      `https://res.cloudinary.com/dnbgxu47a/image/upload/v1612981070/roulette/${getRandom(1, 5)}.gif`
    )
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const buildAbandonedEmbed = () =>
  new EmbedBuilder()
    .setTitle("⌛ Juego abandonado")
    .setDescription("La ruleta se quedó sin movimientos por 5 minutos.")
    .setColor(colorForCategory("fun"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const pull: ISlashCommand = {
  name: "ruleta",
  category: "fun",
  description:
    "Ruleta rusa. Cada jugador escribe `roll` cuando es su turno. Podés jugar solo.",
  ownerOnly: false,
  options: [
    {
      name: "player2",
      description: "Segundo jugador (opcional — sin esto jugás solo)",
      type: ApplicationCommandOptionType.User,
      required: false,
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
  examples: [
    "/ruleta",
    "/ruleta player2:@bob",
    "/ruleta player2:@bob player3:@carla player4:@diego",
  ],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      if (
        !interaction.channel?.isTextBased() ||
        !interaction.channel.isSendable()
      ) {
        return interaction.reply({
          content: "Este canal no soporta el juego.",
          flags: MessageFlags.Ephemeral,
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

      // Reject duplicates — including someone listing themselves as player2.
      if (new Set(playerIds).size !== playerIds.length) {
        return interaction.reply({
          content: "No podés agregar al mismo jugador dos veces.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const users = await Promise.all(
        playerIds.map((id) => client.users.fetch(id))
      );
      if (users.some((u) => u.bot)) {
        return interaction.reply({
          content: "No puedes agregar bots.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const ruleta = new Death.Roulette({ jugadores: playerIds });
      const isSolo = playerIds.length === 1;

      await interaction.reply({ embeds: [buildKickoffEmbed(users)] });

      const collector = channel.createMessageCollector({
        filter: (msg) =>
          ruleta.game.turno === msg.author.id &&
          msg.content.toLowerCase() === "roll",
        idle: IDLE_TIMEOUT_MS,
      });

      collector.on("collect", async (msg) => {
        const roll = getRandom(1, 5);
        const dead = ruleta.elegir(roll);

        if (dead) {
          await channel.send({
            embeds: [buildDeathEmbed(msg.author.toString())],
          });
          collector.stop("dead");
          return;
        }

        const nextUser = users.find((u) => u.id === ruleta.game.turno);
        // In solo mode the next turn is always the same player — skip the
        // 'Turno de' line so we don't repeat the player's name twice per roll.
        const nextMention = isSolo ? null : (nextUser?.toString() ?? "?");

        await channel.send({
          embeds: [
            buildAliveEmbed(
              msg.author.toString(),
              ALIVE_MSGS[getRandom(0, ALIVE_MSGS.length - 1)],
              nextMention,
              ruleta.game.posicion
            ),
          ],
        });
      });

      collector.on("end", async (_, reason) => {
        if (reason === "idle") {
          await channel.send({ embeds: [buildAbandonedEmbed()] });
        }
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
} from "discord.js";
import Death from "death-games";

import _config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import {
  BOT_BRAND_NAME,
  BOT_VERSION,
  colorForCategory,
} from "../../shared/constants/branding";
import words from "../../shared/data/words";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler, random, shuffle } from "../../shared/utils/helpers";

const { photoRoot } = _config;

const LIVES = 7;
const IMG_BASE =
  "https://res.cloudinary.com/dnbgxu47a/image/upload/v1612912935/ahorcado";

const WORD_PICK_TIMEOUT_MS = 20_000;
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

// Signal-carrying colors for end-state, same convention exception as /imc and /ruleta.
const WIN_COLOR = 0x57f287; // discord green
const LOSE_COLOR = 0xed4245; // mod red

const rotate = (turn: number, last: number, step: number) => {
  let next = turn + step;
  if (next < 0) next = last;
  if (next > last) next = 0;
  return next;
};

const fmtBoard = (asciiTokens: string[]) =>
  "```\n" + asciiTokens.join(" ") + "\n```";

const baseEmbed = () =>
  new EmbedBuilder()
    .setColor(colorForCategory("fun"))
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

const buildKickoffEmbed = (
  hangmanAscii: string[],
  startingUsername: string,
  isSolo: boolean,
  botPicked: boolean
) =>
  baseEmbed()
    .setTitle("🎯 Ahorcado")
    .setDescription(
      `${fmtBoard(hangmanAscii)}**Empieza ${startingUsername}**${
        botPicked ? "\n_(palabra elegida por el bot)_" : ""
      }${isSolo ? "\n_(jugando solo)_" : ""}`
    );

const buildTurnEmbed = (
  hangmanAscii: string[],
  nextUsername: string,
  livesLeft: number,
  wrongLetters: string[],
  detail: string,
  imageUrl: string
) => {
  const lines: string[] = [];
  if (detail) lines.push(detail);
  lines.push(fmtBoard(hangmanAscii));
  lines.push(`**Turno de ${nextUsername}**`);
  lines.push(`Intentos restantes: **${livesLeft}**`);
  lines.push(
    `Letras incorrectas: **[${wrongLetters.join(", ")}]**`
  );

  return baseEmbed()
    .setTitle("🎯 Ahorcado")
    .setDescription(lines.join("\n"))
    .setImage(imageUrl);
};

const buildEndEmbed = (
  won: boolean,
  word: string,
  finisherUsername: string,
  finalAscii: string[]
) => {
  const text = won
    ? `**¡Ganaron!** La palabra era: **${word}**\nDescubierto por: **${finisherUsername}**\n${fmtBoard(finalAscii)}`
    : `**¡Perdieron!** La palabra era: **${word}**\nÚltimo error: **${finisherUsername}**\n${fmtBoard(finalAscii)}`;

  const imageUrl = won
    ? `${IMG_BASE}/${LIVES}.png`
    : `${photoRoot}/hangman/${random(0, 2)}.gif`;

  return new EmbedBuilder()
    .setTitle(won ? "🏆 Ahorcado — Victoria" : "💀 Ahorcado — Derrota")
    .setDescription(text)
    .setColor(won ? WIN_COLOR : LOSE_COLOR)
    .setImage(imageUrl)
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });
};

const buildAbandonedEmbed = () =>
  baseEmbed()
    .setTitle("⌛ Ahorcado abandonado")
    .setDescription("La partida se quedó sin movimientos por 5 minutos.");

const pull: ISlashCommand = {
  name: "ahorcado",
  category: "fun",
  description:
    "Ahorcado. El bot elige la palabra; pasa bot_picks_word:false para elegirla por DM.",
  ownerOnly: false,
  options: [
    {
      name: "player2",
      description: "Segundo jugador (opcional — sin esto juegas solo)",
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
    {
      name: "bot_picks_word",
      description: "El bot elige la palabra (default: true). Pon false para elegirla por DM.",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  examples: [
    "/ahorcado",
    "/ahorcado player2:@bob",
    "/ahorcado player2:@bob bot_picks_word:false",
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
      // Default true: most plays just want to start a game without the DM
      // dance. Pass bot_picks_word:false to opt into picking the word yourself.
      const botPicks =
        (args.find((a) => a.name === "bot_picks_word")?.value as
          | boolean
          | undefined) ?? true;
      const isSolo = playerIds.length === 1;

      // Solo play only makes sense if the bot picks the word — otherwise the
      // single player would be guessing their own choice.
      if (isSolo && !botPicks) {
        return interaction.reply({
          content:
            "Para jugar solo necesitas que el bot elija la palabra. No pongas `bot_picks_word:false`.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // No duplicate players (catches both 'player2 == player3' and 'player2 == self').
      if (new Set(playerIds).size !== playerIds.length) {
        return interaction.reply({
          content: "No puedes agregar al mismo jugador dos veces.",
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

      // death-games' Hangman requires >= 2 player IDs. For solo play we
      // duplicate the lone ID so the library is happy; the bot's collector
      // filter (msg.author.id === game.turno) keeps matching the same user
      // every round, so it plays as a real solo game.
      const libPlayerIds = isSolo ? [playerIds[0], playerIds[0]] : playerIds;
      const libUsernames = libPlayerIds.map(
        (id) => users.find((u) => u.id === id)?.username ?? "?"
      );

      let word = "hola";
      if (botPicks) {
        word = words[random(0, words.length - 1)].nombre.toLowerCase();
        await interaction.reply({
          content: "Arrancando ahorcado — el bot eligió la palabra.",
        });
      } else {
        const actionRow =
          new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            new StringSelectMenuBuilder()
              .setCustomId("hangman")
              .setPlaceholder("Selecciona una palabra")
              .addOptions(
                shuffle(
                  words.map((x) => ({ label: x.nombre, value: x.nombre }))
                ).slice(0, 25)
              )
          );

        let dm;
        try {
          dm = await interaction.user.createDM();
          await dm.send({ components: [actionRow] });
        } catch {
          return interaction.reply({
            content:
              "No te pude enviar un DM. Activa los DMs del servidor o usa `bot_picks_word:true`.",
            flags: MessageFlags.Ephemeral,
          });
        }

        await interaction.reply({
          content: "Te envié un DM para elegir la palabra. Tienes 20s.",
        });

        try {
          const select = await dm.awaitMessageComponent({
            componentType: ComponentType.StringSelect,
            time: WORD_PICK_TIMEOUT_MS,
            idle: WORD_PICK_TIMEOUT_MS,
            dispose: true,
            filter: (i) => i.user.id === interaction.user.id,
          });
          word = select.values[0].toLowerCase();
          await select.update({
            content: `Escogiste la palabra: \`${word}\``,
            components: [],
          });
        } catch {
          await channel.send(
            `${interaction.user} no eligió palabra a tiempo. Cancelado.`
          );
          return;
        }
      }

      const hangman = new Death.Hangman(word, {
        jugadores: libPlayerIds,
        lowerCase: true,
        vidas: LIVES,
      });

      let turn = 0;

      hangman.on("end", (game: any) => {
        // The library hasn't rotated yet for the final player — undo our
        // pre-rotation so libUsernames[turn] = the player who actually moved.
        turn = rotate(turn, libUsernames.length - 1, -1);
        channel.send({
          embeds: [
            buildEndEmbed(
              game.winned,
              game.palabra,
              libUsernames[turn],
              game.ascii
            ),
          ],
        });
      });

      await channel.send({
        embeds: [
          buildKickoffEmbed(
            hangman.game.ascii,
            libUsernames[turn],
            isSolo,
            botPicks
          ),
        ],
      });
      turn = rotate(turn, libUsernames.length - 1, 1);

      const collector = channel.createMessageCollector({
        filter: (msg) =>
          msg.author.id === hangman.game.turno &&
          /[A-Za-záéíóúñ]/.test(msg.content),
        idle: IDLE_TIMEOUT_MS,
      });

      collector.on("collect", (msg) => {
        let found = false;
        if (msg.content.length > 1 && word === msg.content.toLowerCase()) {
          // Full-word guess — reveal every letter.
          for (let i = 0; i < word.length; i++) {
            if (!hangman.game.ascii.includes(word[i])) hangman.find(word[i]);
          }
        } else {
          found = !!hangman.find(msg.content);
        }

        if (hangman.game.ended) return collector.stop("end");

        let detail = "";
        if (!found) {
          if (hangman.game.ascii.includes(msg.content)) {
            detail = `- La letra "${msg.content}" ya se encuentra en la palabra.`;
          } else {
            detail =
              msg.content.length > 1
                ? `- Vaya, la palabra **${msg.content}** no es correcta.`
                : `- Vaya, la letra **${msg.content}** no se encontraba en la palabra.`;
          }
        }

        turn = rotate(turn, libUsernames.length - 1, 1);
        channel.send({
          embeds: [
            buildTurnEmbed(
              hangman.game.ascii,
              libUsernames[turn],
              hangman.game.vidas,
              hangman.game.letrasIncorrectas,
              detail,
              `${IMG_BASE}/${hangman.game.vidas}.png`
            ),
          ],
        });
      });

      collector.on("end", async (_, reason) => {
        // 'end' is our explicit stop in the win/lose branch; 'idle' is the
        // 5-min silence guard.
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

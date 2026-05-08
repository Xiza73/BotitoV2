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

const buildSkipEmbed = (
  playerMention: string,
  letter: string,
  asciiTokens: string[]
) =>
  baseEmbed()
    .setTitle("🎯 Ahorcado")
    .setDescription(
      `${playerMention} ya probó la letra **${letter}** — sigue su turno.\n${fmtBoard(asciiTokens)}`
    );

const buildEliminationEmbed = (
  playerMention: string,
  attempt: string,
  asciiTokens: string[]
) =>
  baseEmbed()
    .setColor(LOSE_COLOR)
    .setTitle("☠️ Jugador eliminado")
    .setDescription(
      `${playerMention} intentó adivinar **${attempt}** — palabra incorrecta.\nQueda fuera de la partida.\n${fmtBoard(asciiTokens)}`
    );

const buildAllEliminatedEmbed = (word: string, finalAscii: string[]) =>
  new EmbedBuilder()
    .setTitle("💀 Ahorcado — Todos eliminados")
    .setDescription(
      `Todos quedaron fuera tras intentos fallidos de adivinar la palabra.\nLa palabra era: **${word}**\n${fmtBoard(finalAscii)}`
    )
    .setColor(LOSE_COLOR)
    .setFooter({ text: `${BOT_BRAND_NAME} ${BOT_VERSION}` });

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

      // Semantics: `turn` is the index of the player whose turn it is RIGHT
      // NOW (the one we're waiting on). After a guess we advance to the next
      // alive player. Decoupled from the library's internal turn tracker so
      // we can skip eliminated players that the library doesn't know about.
      let turn = 0;

      // Players knocked out by guessing the wrong full word. Their messages
      // are ignored by the filter and turn rotation skips them.
      const eliminated = new Set<string>();

      const peekNextTurn = (from: number) => {
        let idx = from;
        do {
          idx = rotate(idx, libUsernames.length - 1, 1);
        } while (eliminated.has(libPlayerIds[idx]));
        return idx;
      };

      hangman.on("end", (game: any) => {
        channel.send({
          embeds: [
            buildEndEmbed(
              game.winned,
              game.palabra,
              libUsernames[turn], // the player who just moved
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

      const collector = channel.createMessageCollector({
        filter: (msg) =>
          msg.author.id === libPlayerIds[turn] &&
          !eliminated.has(msg.author.id) &&
          /[A-Za-záéíóúñ]/.test(msg.content),
        idle: IDLE_TIMEOUT_MS,
      });

      collector.on("collect", (msg) => {
        const text = msg.content.toLowerCase();
        const isFullWord = text.length > 1;

        // === Dedup: single-letter guesses already tried ===
        // The library decrements vidas every time `find()` sees a letter that's
        // already in letrasUsadas (covers both correct and incorrect repeats),
        // so we have to short-circuit BEFORE calling find().
        if (!isFullWord && hangman.game.letrasUsadas.includes(text)) {
          channel.send({
            embeds: [
              buildSkipEmbed(msg.author.toString(), text, hangman.game.ascii),
            ],
          });
          return; // No life lost, no turn rotation — same player keeps the turn.
        }

        // === Full-word guess ===
        if (isFullWord) {
          if (text === word) {
            // Correct! Reveal every still-hidden letter.
            for (let i = 0; i < word.length; i++) {
              if (!hangman.game.ascii.includes(word[i])) hangman.find(word[i]);
            }
            // The win triggers 'end' inside find() via the embed handler.
            if (hangman.game.ended) return collector.stop("end");
          } else {
            // Wrong full-word → eliminate this player (no life consumed; the
            // word was wrong, but it's also a one-shot: they get knocked out).
            eliminated.add(msg.author.id);
            channel.send({
              embeds: [
                buildEliminationEmbed(
                  msg.author.toString(),
                  msg.content,
                  hangman.game.ascii
                ),
              ],
            });

            const aliveUnique = new Set(
              libPlayerIds.filter((id) => !eliminated.has(id))
            );
            if (aliveUnique.size === 0) {
              channel.send({
                embeds: [
                  buildAllEliminatedEmbed(word, hangman.game.ascii),
                ],
              });
              return collector.stop("everyone-eliminated");
            }

            // Someone still alive — rotate the turn (skipping eliminated)
            // and prompt the next player.
            const nextTurnIdx = peekNextTurn(turn);
            channel.send({
              embeds: [
                buildTurnEmbed(
                  hangman.game.ascii,
                  libUsernames[nextTurnIdx],
                  hangman.game.vidas,
                  hangman.game.letrasIncorrectas,
                  "",
                  `${IMG_BASE}/${hangman.game.vidas}.png`
                ),
              ],
            });
            turn = nextTurnIdx;
            return;
          }
        } else {
          // === Single-letter guess ===
          hangman.find(text);
          if (hangman.game.ended) return collector.stop("end");
        }

        // Build the detail line for the next-turn embed.
        let detail = "";
        if (!isFullWord) {
          detail = hangman.game.letrasIncorrectas.includes(text)
            ? `- Vaya, la letra **${text}** no se encontraba en la palabra.`
            : `- ¡La letra **${text}** está en la palabra!`;
        }

        const nextTurnIdx = peekNextTurn(turn);
        channel.send({
          embeds: [
            buildTurnEmbed(
              hangman.game.ascii,
              libUsernames[nextTurnIdx],
              hangman.game.vidas,
              hangman.game.letrasIncorrectas,
              detail,
              `${IMG_BASE}/${hangman.game.vidas}.png`
            ),
          ],
        });
        turn = nextTurnIdx;
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

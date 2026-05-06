import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  StringSelectMenuBuilder,
} from "discord.js";
import Death from "death-games";
import _config from "../../config";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import words from "../../shared/data/words";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler, random, shuffle } from "../../shared/utils/helpers";

const { photoRoot } = _config;
const LIVES = 7;
const IMG_BASE =
  "https://res.cloudinary.com/dnbgxu47a/image/upload/v1612912935/ahorcado";

const rotate = (turn: number, last: number, step: number) => {
  let next = turn + step;
  if (next < 0) next = last;
  if (next > last) next = 0;
  return next;
};

const pull: ISlashCommand = {
  name: "hangman",
  category: "fun",
  description:
    "Ahorcado. Vos elegís palabra (DM con menú) o el bot la elige (con bot_picks_word).",
  ownerOnly: false,
  options: [
    {
      name: "player2",
      description: "Segundo jugador (obligatorio)",
      type: MoreCommandTypes.USER,
      required: true,
    },
    {
      name: "player3",
      description: "Tercer jugador",
      type: MoreCommandTypes.USER,
      required: false,
    },
    {
      name: "player4",
      description: "Cuarto jugador",
      type: MoreCommandTypes.USER,
      required: false,
    },
    {
      name: "player5",
      description: "Quinto jugador",
      type: MoreCommandTypes.USER,
      required: false,
    },
    {
      name: "bot_picks_word",
      description: "Si está en true, el bot elige la palabra",
      type: MoreCommandTypes.BOOLEAN,
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
      const botPicks =
        (args.find((a) => a.name === "bot_picks_word")?.value as
          | boolean
          | undefined) ?? false;

      const users = await Promise.all(
        playerIds.map((id) => client.users.fetch(id))
      );
      if (users.some((u) => u.bot)) {
        return interaction.reply({
          content: "No podés meter bots.",
          ephemeral: true,
        });
      }
      const usernames = users.map((u) => u.username);

      let word = "hola";
      if (botPicks) {
        word = words[random(0, words.length - 1)].nombre.toLowerCase();
        await interaction.reply({
          content: `Arrancando ahorcado — el bot eligió la palabra.`,
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
              "No te pude mandar DM. Activá los DMs del servidor o usá `bot_picks_word: true`.",
            ephemeral: true,
          });
        }

        await interaction.reply({
          content: `Te mandé un DM para elegir la palabra. Tenés 20s.`,
        });

        try {
          const select = await dm.awaitMessageComponent({
            componentType: ComponentType.StringSelect,
            time: 20000,
            idle: 20000,
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
        jugadores: playerIds,
        lowerCase: true,
        vidas: LIVES,
      });

      let turn = 0;

      hangman.on("end", (game: any) => {
        turn = rotate(turn, usernames.length - 1, -1);
        let text = "";
        let lives = 0;
        if (game.winned) {
          text =
            "El juego ha finalizado! La palabra era: **" +
            game.palabra +
            "**\nDescubierto por: **" +
            usernames[turn] +
            "**```" +
            game.ascii.join(" ") +
            "```";
          lives = LIVES;
        } else {
          text =
            "Han perdido! La palabra era: **" +
            game.palabra +
            "**\nÚltimo error: **" +
            usernames[turn] +
            "**```\n" +
            game.ascii.join(" ") +
            "```";
        }
        channel.send({
          embeds: [
            {
              color: 0x0099ff,
              title: "Ahorcado",
              description: text,
              image: {
                url: lives
                  ? `${IMG_BASE}/${lives}.png`
                  : `${photoRoot}/hangman/${random(0, 2)}.gif`,
              },
            },
          ],
        });
      });

      await channel.send({
        embeds: [
          {
            color: 0x0099ff,
            title: "Ahorcado",
            description:
              "```\n" +
              hangman.game.ascii.join(" ") +
              "```**Empieza " +
              usernames[turn] +
              "**",
          },
        ],
      });
      turn = rotate(turn, usernames.length - 1, 1);

      const collector = channel.createMessageCollector({
        filter: (msg) =>
          msg.author.id === hangman.game.turno &&
          /[A-Za-záéíóúñ]/.test(msg.content),
      });

      collector.on("collect", (msg) => {
        let found = false;
        if (msg.content.length > 1 && word === msg.content.toLowerCase()) {
          for (let i = 0; i < word.length; i++) {
            if (!hangman.game.ascii.includes(word[i])) hangman.find(word[i]);
          }
        } else {
          found = !!hangman.find(msg.content);
        }

        if (hangman.game.ended) return collector.stop();

        let details = "";
        if (!found) {
          if (hangman.game.ascii.includes(msg.content)) {
            details +=
              '- La letra "' + msg.content + '" ya se encuentra en la palabra!';
          } else {
            details += "- Vaya! Parece que la ";
            details +=
              msg.content.length > 1
                ? "palabra **" + msg.content + "** no es correcta!"
                : "letra **" +
                  msg.content +
                  "** no se encontraba en la palabra!";
          }
        }
        details +=
          "```\n" +
          hangman.game.ascii.join(" ") +
          "\n```**Turno de " +
          usernames[turn] +
          "**\nIntentos restantes: **" +
          hangman.game.vidas +
          "**\nLetras incorrectas: **[" +
          hangman.game.letrasIncorrectas.join(", ") +
          "]**";

        turn = rotate(turn, usernames.length - 1, 1);
        channel.send({
          embeds: [
            {
              color: 0x0099ff,
              title: "Ahorcado",
              description: details,
              image: { url: `${IMG_BASE}/${hangman.game.vidas}.png` },
            },
          ],
        });
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

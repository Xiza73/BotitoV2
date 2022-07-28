import { EmbedBuilder } from "discord.js";
import { Queue } from "distube";
import ClientDiscord from "../../shared/classes/ClientDiscord";

module.exports = {
  name: "distube",
  type: "distube",
  execute(client: ClientDiscord) {
    const status = (queue: Queue) =>
      `Volumen: \`${queue.volume}%\` | Filtro: \`${
        queue.filters.add(", ") || "❌"
      }\` | Loop: \`${
        queue.repeatMode
          ? queue.repeatMode === 2
            ? "All Queue"
            : "This Song"
          : "❌"
      }\` | Autoplay: \`${queue.autoplay ? "✔️" : "❌"}\``;
    client.distube
      .on("playSong", (queue, song) => {
        return queue.textChannel?.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Aqua")
              .setDescription(
                `🎵 | Sonando \`${song.name}\` - \`${
                  song.formattedDuration
                }\`\nPedida por: ${song.user}\n${status(queue)}`
              ),
          ],
        });
      })
      .on("addSong", (queue, song) =>
        queue.textChannel?.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Random")
              .setDescription(
                `👌| Agregada ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
              ),
          ],
        })
      )
      .on("addList", (queue, playlist) =>
        queue.textChannel?.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Random")
              .setDescription(
                `👌 | Agregada \`${playlist.name}\` playlist (${
                  playlist.songs.length
                } canciones) a la cola\n${status(queue)}`
              ),
          ],
        })
      )
      .on("error", (channel, e) => {
        channel?.send(`📛 | Error encontrado: ${e.toString().slice(0, 1974)}`);
        console.error(e);
      })
      .on("empty", (queue) => {
        setTimeout(() => {
          queue.textChannel?.send(
            "Canal de voz vacío! Saliendo del canal... 😥"
          );
        }, 3000);
      })
      .on("searchNoResult", (message, query) =>
        message.channel.send(`❌ | No hay resultados para \`${query}\`!`)
      )
      .on("finish", (queue) => {
        setTimeout(() => {
          return queue.textChannel?.send("Cola vacía, adiós!");
        }, 5000);
      });
  },
};

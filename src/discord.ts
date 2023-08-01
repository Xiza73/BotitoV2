import { Intents } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import _config from "./config";
import ClientDiscord from "./shared/classes/ClientDiscord";
// import { DisTube } from "distube";
// import { SpotifyPlugin } from "@distube/spotify";
import * as handler from "./handlers";

const client: ClientDiscord = new ClientDiscord(
  {
    partials: ["CHANNEL", "MESSAGE", "REACTION", "GUILD_MEMBER"],
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
    allowedMentions: {
      parse: ["users", "roles"],
      repliedUser: false,
    },
  },
  {
    prefix: _config.prefix,
    ownerId: _config.ownerId,
  }
);
client.categories = readdirSync(path.join(__dirname, "commands"));

/* client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  leaveOnFinish: true,
  emitAddSongWhenCreatingQueue: false,
  plugins: [new SpotifyPlugin()],
  youtubeDL: false, 
}); */

(async () => {
  // events
  await handler.loadEvents(client);
  await handler.loadCommands(client);
  await handler.loadSlashCommands(client);
  await handler.antiCrash(client);
  await client.login(_config.token);
})();

export default client;

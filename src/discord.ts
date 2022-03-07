import { Intents, Message } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import _config from "./config/config";
import ClientDiscord from "./shared/classes/ClientDiscord";
import { DisTube } from "distube";
import { SpotifyPlugin } from "@distube/spotify";
import * as handler from "./handlers";

const client: ClientDiscord = new ClientDiscord(
  {
    partials: ["CHANNEL", "MESSAGE", "GUILD_MEMBER", "REACTION"],
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

client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  leaveOnFinish: true,
  emitAddSongWhenCreatingQueue: false,
  plugins: [new SpotifyPlugin()],
  youtubeDL: false,
});

//events
handler.antiCrash(client);
handler.loadEvents(client);
handler.loadCommands(client);
handler.loadSlashCommands(client);

client.login(_config.token);

export default client;

import { GatewayIntentBits, Partials } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import _config from "./config";
import ClientDiscord from "./shared/classes/ClientDiscord";
import * as handler from "./handlers";

const client: ClientDiscord = new ClientDiscord(
  {
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.GuildMember],
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
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

(async () => {
  await handler.loadEvents(client);
  await handler.loadCommands(client);
  await handler.loadSlashCommands(client);
  await handler.antiCrash(client);
  await client.login(_config.token);
})();

export default client;

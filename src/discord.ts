import { GatewayIntentBits, Partials } from "discord.js";
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
      GatewayIntentBits.MessageContent,
    ],
    allowedMentions: {
      parse: ["users", "roles"],
      repliedUser: false,
    },
  },
  {
    ownerId: _config.ownerId,
  }
);

(async () => {
  await handler.loadEvents(client);
  await handler.loadSlashCommands(client);
  await handler.antiCrash(client);
  await client.login(_config.token);
})();

export default client;

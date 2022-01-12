import { Message } from "discord.js";
import { readdirSync } from 'fs'
import path from "path";
import _config from "./config/config";

import ClientDiscord from "./shared/classes/ClientDiscord";
import { action } from "./shared/utils/actions";

const client: ClientDiscord = new ClientDiscord();
client.categories = readdirSync(path.join(__dirname, "commands"));
const prefix: string = _config.prefix;

["command"].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

try {
  client.on("ready", () => {
    console.log(`${client.user!.tag} is up!`);
    client.user!.setPresence({
      status: "online",
      activity: {
        name: "b!help",
        type: "PLAYING",
      },
    });
  });
} catch (error) {
  console.error(error);
}

client.on("message", async (message: Message) => {
  //Control de comandos
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  //Estructura del comando
  const args: string[] = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
  const cmd: string = args.shift()!.toLowerCase();

  if (cmd.length === 0) return;

  let command = client.commands.get(cmd);
  if (!command) command = client.commands.get(client.aliases.get(cmd));

  if (command) command.run(client, message, args);

  if (cmd !== "") {
    action(cmd, message); //135
  }
});

client.login(_config.token);

export default client;
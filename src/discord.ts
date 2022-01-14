import { Message } from "discord.js";
import { readdirSync } from 'fs'
import path from "path";
import _config from "./config/config";
import { goodMorning } from "./shared/utils/goodMorning";
import ClientDiscord from "./shared/classes/ClientDiscord";
import { action } from "./shared/utils/actions";
import { reminder } from "./shared/utils/birthdayReminder";
import ScheduleMessage from "./shared/classes/ScheculeMessage";

const client: ClientDiscord = new ClientDiscord();
client.categories = readdirSync(path.join(__dirname, "commands"));
const prefix: string = _config.prefix;

["command"].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

try {
  client.on("ready", () => {
    console.log(`${client.user!.username} is up!`);
    const morning = new ScheduleMessage(goodMorning, client)
    morning.action.start()
    const birthday = new ScheduleMessage(reminder, client)
    birthday.action.start()
    client.user!.setPresence({
      status: "online",
      activity: {
        name: `${_config.prefix}help`,
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
import { readdirSync } from "fs";

import ClientDiscord from "../shared/classes/ClientDiscord";
import { ICommand, ISlashCommand } from "../shared/types";
import { ApplicationCommandDataResolvable } from "discord.js";
import path from "path";
import chalk from "chalk";

const checkHandler = (
  type: "Event" | "Command" | "SlashCommand",
  file: string,
  status: 0 | 1
) => {
  if (status === 1)
    return ` ✔️  => ${type} '${file.substring(0, file.length - 3)}' is ready `;
  return ` ❌  => ${type} '${file.substring(
    0,
    file.length - 3
  )}' missing a help.name or help.name is not in string `;
};

export const loadEvents = async (client: ClientDiscord) => {
  const eventFolders = readdirSync(path.resolve(__dirname, "./../events"));
  for (const folder of eventFolders) {
    const eventFiles = readdirSync(
      path.resolve(__dirname, `./../events/${folder}`)
    ).filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
      const event = await import(`../events/${folder}/${file}`);

      if (event.name) {
        console.log(chalk.bgGreen.black(checkHandler("Event", file, 1)));
      } else {
        console.log(chalk.bgRedBright.black(checkHandler("Event", file, 0)));
        continue;
      }

      if (event.type === "distube") {
        event.execute(client);
      } else if (event.type) {
        if (event.once) {
          client.once(
            event.name,
            async (...args) => await event.execute(...args, client)
          );
        } else {
          client.on(
            event.name,
            async (...args) => await event.execute(...args, client)
          );
        }
      }
    }
  }
};

/**
 * Load Prefix Commands
 */
type IPull = {
  default: ICommand;
};
export const loadCommands = async (client: ClientDiscord) => {
  const commandFolders = readdirSync(path.resolve(__dirname, "./../commands"));
  for (const folder of commandFolders) {
    const commandFiles = readdirSync(
      path.resolve(__dirname, `./../commands/${folder}`)
    ).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const pull: IPull = await import(
        path.resolve(__dirname, `./../commands/${folder}/${file}`)
      );

      if (pull.default?.name) {
        client.commands.set(pull.default.name, pull.default);
        console.log(
          chalk.bgYellowBright.black(checkHandler("Command", file, 1))
        );
      } else {
        console.log(chalk.bgRedBright.black(checkHandler("Command", file, 0)));
        continue;
      }

      if (pull.default.aliases && Array.isArray(pull.default.aliases))
        pull.default.aliases.forEach((alias) =>
          client.aliases.set(alias, pull.default.name)
        );
    }
  }
};

/**
 * Load SlashCommands
 */
export const loadSlashCommands = async (client: ClientDiscord) => {
  const slash: ISlashCommand[] = [];

  const commandFolders = readdirSync(
    path.resolve(__dirname, "./../slashCommands")
  );
  for (const folder of commandFolders) {
    const commandFiles = readdirSync(
      path.resolve(__dirname, `./../slashCommands/${folder}`)
    ).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const pull: {
        default: ISlashCommand;
      } = await import(
        path.resolve(__dirname, `../slashCommands/${folder}/${file}`)
      );
      const command = pull?.default;

      if (command?.name) {
        client.slashCommands.set(command.name, command);
        slash.push(command);
        console.log(
          chalk.bgGreenBright.black(checkHandler("SlashCommand", file, 1))
        );
      } else {
        console.log(
          chalk.bgRedBright.black(checkHandler("SlashCommand", file, 0))
        );
        continue;
      }
    }
  }

  client.on("ready", async () => {
    try {
      // Register Slash Commands for a single guild
      // await client.guilds.cache
      //    .get("YOUR_GUILD_ID")
      //    .commands.set(slash);

      // Register Slash Commands for all the guilds
      const commands: ApplicationCommandDataResolvable[] = slash.map(
        (command) => {
          return {
            name: command.name,
            description: command.description,
            options: command.options as any,
          };
        }
      );
      console.log({
        commands,
      });
      await client.application?.commands.set(commands);
    } catch (error) {
      console.error(error);
    }
  });
};

export const antiCrash = async (_: ClientDiscord) => {
  process.on("unhandledRejection", (reason, p) => {
    console.log(" [antiCrash] :: Unhandled Rejection/Catch");
    console.log(reason, p);
  });
  process.on("uncaughtException", (err, origin) => {
    console.log(" [antiCrash] :: Uncaught Exception/Catch");
    console.log(err, origin);
  });
  process.on("uncaughtExceptionMonitor", (err, origin) => {
    console.log(" [antiCrash] :: Uncaught Exception/Catch (MONITOR)");
    console.log(err, origin);
  });
  process.on("multipleResolves", (type, promise, reason) => {
    console.log(" [antiCrash] :: Multiple Resolves");
    console.log(type, promise, reason);
  });
};

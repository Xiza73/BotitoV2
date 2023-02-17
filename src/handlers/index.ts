import { readdirSync } from "fs";

import ClientDiscord from "../shared/classes/ClientDiscord";
import { ICommand } from "../shared/types";
import { ApplicationCommandDataResolvable } from "discord.js";
import path from "path";
import chalk from "chalk";
import { logger } from "../shared/utils/helpers";

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
        logger(chalk.bgGreen.black(checkHandler("Event", file, 1)));
      } else {
        logger(chalk.bgRedBright.black(checkHandler("Event", file, 0)));
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
        logger(chalk.bgYellowBright.black(checkHandler("Command", file, 1)));
      } else {
        logger(chalk.bgRedBright.black(checkHandler("Command", file, 0)));
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
  const slash: ApplicationCommandDataResolvable[] = [];

  const commandFolders = readdirSync(
    path.resolve(__dirname, "./../slashCommands")
  );
  for (const folder of commandFolders) {
    const commandFiles = readdirSync(
      path.resolve(__dirname, `./../slashCommands/${folder}`)
    ).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const command = (
        await import(
          path.resolve(__dirname, `../slashCommands/${folder}/${file}`)
        )
      ).default;

      if (command.name) {
        client.slashCommands.set(command.name, command);
        slash.push(command);
        logger(
          chalk.bgGreenBright.black(checkHandler("SlashCommand", file, 1))
        );
      } else {
        logger(chalk.bgRedBright.black(checkHandler("SlashCommand", file, 0)));
        continue;
      }
    }
  }

  client.on("ready", async () => {
    // Register Slash Commands for a single guild
    // await client.guilds.cache
    //    .get("YOUR_GUILD_ID")
    //    .commands.set(slash);

    // Register Slash Commands for all the guilds
    await client.application?.commands.set(slash);
  });
};

export const antiCrash = async (_: ClientDiscord) => {
  process.on("unhandledRejection", (reason, p) => {
    logger(" [antiCrash] :: Unhandled Rejection/Catch");
    logger({ reason, p });
  });
  process.on("uncaughtException", (err, origin) => {
    logger(" [antiCrash] :: Uncaught Exception/Catch");
    logger({ err, origin });
  });
  process.on("uncaughtExceptionMonitor", (err, origin) => {
    logger(" [antiCrash] :: Uncaught Exception/Catch (MONITOR)");
    logger({ err, origin });
  });
  process.on("multipleResolves", (type, promise, reason) => {
    logger(" [antiCrash] :: Multiple Resolves");
    logger({ type, promise, reason });
  });
};

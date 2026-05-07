import { ApplicationCommandDataResolvable, ClientEvents } from "discord.js";
import chalk from "chalk";

import ClientDiscord from "../shared/classes/ClientDiscord";
import events from "../events";
import slashCommands from "../slashCommands";
import { logger } from "../shared/utils/helpers";

const ok = (type: "Event" | "SlashCommand", name: string) =>
  ` ✔️  => ${type} '${name}' is ready `;

const missing = (type: "Event" | "SlashCommand") =>
  ` ❌  => ${type} missing a 'name' field or 'name' is not a string `;

export const loadEvents = (client: ClientDiscord) => {
  for (const event of events) {
    if (!event.name) {
      logger(chalk.bgRedBright.black(missing("Event")));
      continue;
    }

    logger(chalk.bgGreen.black(ok("Event", event.name)));

    if (!event.type) continue;

    const handler = async (...args: unknown[]) =>
      await event.execute(...args, client);

    if (event.once) {
      client.once(event.name as keyof ClientEvents, handler);
    } else {
      client.on(event.name as keyof ClientEvents, handler);
    }
  }
};

export const loadSlashCommands = (client: ClientDiscord) => {
  const slash: ApplicationCommandDataResolvable[] = [];

  for (const command of slashCommands) {
    if (!command.name) {
      logger(chalk.bgRedBright.black(missing("SlashCommand")));
      continue;
    }

    client.slashCommands.set(command.name, command);
    // Cast: ISlashCommand y ApplicationCommandDataResolvable son compatibles en
    // runtime, pero TS no puede inferir la unión discriminada porque
    // SlashCommandsOptions.type es opcional. Deuda preexistente que el manifest
    // estático reveló (antes el `import()` dinámico hacía `command: any`).
    slash.push(command as unknown as ApplicationCommandDataResolvable);
    logger(chalk.bgGreenBright.black(ok("SlashCommand", command.name)));
  }

  client.on("clientReady", async () => {
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
};

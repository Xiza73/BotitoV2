import { readdirSync } from "fs";
import ascii from "ascii-table";
import ClientDiscord from "../shared/classes/ClientDiscord";
import { ICommand } from "../shared/types/types";
import path from "path";

const table = new ascii("Commands");
table.setHeading("Command", "Load status");

type IPull = {
    default: ICommand
}

module.exports = (client: ClientDiscord) => {
  readdirSync(path.join(__dirname, "./../commands")).forEach((dir) => {
    const commands = readdirSync(
      path.join(__dirname, `./../commands/${dir}/`)
    ).filter((file) => file.endsWith(".js"));

    for (let file of commands) {
      let pull: IPull = require(`./../commands/${dir}/${file}`);
      
      if (pull.default.name) {
        client.commands.set(pull.default.name, pull.default);
        table.addRow(file, "✅");
      } else {
        table.addRow(
          file,
          `❌  -> missing a help.name, or help.name is not a string.`
        );
        continue;
      }

      if (pull.default.aliases && Array.isArray(pull.default.aliases))
        pull.default.aliases.forEach((alias: any) =>
          client.aliases.set(alias, pull.default.name)
        );
    }
  });

  console.log(table.toString());
};

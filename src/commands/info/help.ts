import { Message, MessageEmbed, Client } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ICommand } from "../../shared/types/types";
import Discord from "discord.js";
import { readdirSync } from "fs";
import { stripIndents } from "common-tags";

const pull: ICommand = {
  name: "help",
  category: "info",
  description: "Muestra todos los comandos o un comando específico",
  usage: `[command]`,
  aliases: ["h", "commands"],
  ownerOnly: false,
  run: async (
    client: Client<boolean> | ClientDiscord,
    message: Message,
    args: string[],
    _: string
  ) => {
    // Buttons that take you to a link
    const row = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setLabel("GitHub")
        .setStyle("LINK")
        .setURL("https://github.com/Xiza73/BotitoV2"),
      new Discord.MessageButton()
        .setLabel("Support")
        .setStyle("LINK")
        .setURL("https://discord.gg/4GgvywcG")
    );

    if (client instanceof ClientDiscord) {
      if (!args[0]) {
        // This is what it commands when using the command without arguments
        const helpEmbed = new MessageEmbed()
          .setTitle(`${client.user?.username} Help`)
          .setDescription(
            ` Hola **<@${message.author.id}>**  \nPuedes usar \`${client.config.prefix}help <command>\` para ver más información de los comandos!\n**Cantidad de comandos:** ${client.commands.size}\n**Cantidad de /comandos:** ${client.slashCommands.size}`
          )
          .setColor("RANDOM");

        // Get all commands
        const commands = (category: string) => {
          return client.commands
            .filter((cmd) => cmd.category === category)
            .map((cmd) => `\`${cmd.name}\``)
            .join(", ");
        };

        const info: { category: string; commands: string }[] =
          client.categories.map((cat: string) => {
            return {
              category: `▫ ${cat[0].toUpperCase() + cat.slice(1)} Commands`,
              commands: `${commands(cat)}`,
            };
          });
        //.reduce((string: string, category: string) => string + "\n\n" + category);

        info.forEach((i) => {
          helpEmbed.addField(i.category, i.commands, true);
        });

        message.reply({
          embeds: [helpEmbed],
          allowedMentions: { repliedUser: false },
          components: [row],
        });
      } else {
        const command =
          client.commands.get(args[0].toLowerCase()) ||
          client.commands.find(
            (c) => c.aliases && c.aliases.includes(args[0].toLowerCase())
          );

        // This is what it sends when using the command with argument and it does not find the command
        if (!command) {
          message.reply({
            content: `There isn't any command named "${args[0]}"`,
            allowedMentions: { repliedUser: false },
          });
        } else {
          // This is what it sends when using the command with argument and if it finds the command
          let command =
            client.commands.get(args[0].toLowerCase()) ||
            client.commands.find(
              (c) => c.aliases && c.aliases.includes(args[0].toLowerCase())
            );
          let name = command?.name;
          let description = command?.description || "No descrpition provided";
          let usage = command?.usage || "No usage provided";
          let aliases = command?.aliases || "No aliases provided";
          let category = command?.category || "No category provided!";

          let helpCmdEmbed = new MessageEmbed()
            .setTitle(
              `${
                client.user?.username
              } Help | \`${name?.toLocaleString()}\` Command`
            )
            .addFields(
              { name: "Description", value: `${description}` },
              { name: "Usage", value: `${usage}` },
              { name: "Aliases", value: `${aliases}` },
              { name: "Category", value: `${category}` }
            )
            .setColor("RANDOM");

          message.reply({
            embeds: [helpCmdEmbed],
            allowedMentions: { repliedUser: false },
          });
        }
      }
    }
  },
};

export default pull;

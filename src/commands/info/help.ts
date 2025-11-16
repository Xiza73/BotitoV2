import { Message, MessageEmbed, Client } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ICommand } from "../../shared/types";
import { logger } from "../../shared/utils";

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
    try {
      if (!(client instanceof ClientDiscord)) return;

      if (!args[0]) {
        // Get all commands
        const commands = (category: string) => {
          return client.commands
            .filter((cmd) => cmd.category === category)
            .map((cmd) => `\`${cmd.name}\``)
            .join(", ");
        };

        const slashCommands = (category: string) => {
          return client.slashCommands
            .filter((cmd) => cmd.category === category)
            .map((cmd) => `\`${cmd.name}\``)
            .join(", ");
        };

        const commandsInfo: { name: string; value: string; inline: boolean }[] =
          client.categories.map((cat: string) => {
            return {
              name: `▫ ${cat[0].toUpperCase() + cat.slice(1)} Commands`,
              value: `${commands(cat)}`,
              inline: true,
            };
          });

        const slashCommandsInfo: {
          name: string;
          value: string;
          inline: boolean;
        }[] = client.categories.map((cat: string) => {
          return {
            name: `▫ ${cat[0].toUpperCase() + cat.slice(1)} Slash Commands`,
            value: `${slashCommands(cat) || "No slash commands found"}`,
            inline: true,
          };
        });

        // This is what it commands when using the command without arguments
        const helpEmbed = new MessageEmbed()
          .setTitle(`${client.user?.username} Help`)
          .setDescription(
            ` Hola **<@${message.author.id}>**  \nPuedes usar \`${client.config.prefix}help <command>\` para ver más información de los comandos!
          \n**Cantidad de comandos:** ${client.commands.size}
          \n**Cantidad de /comandos:** ${client.slashCommands.size}`
          )
          .setColor("RANDOM")
          .addFields([
            {
              name: "Commands",
              inline: false,
              value: " ",
            },
          ])
          .addFields(commandsInfo)
          .addFields([
            {
              name: "Slash Commands",
              inline: false,
              value: " ",
            },
          ])
          .addFields(slashCommandsInfo);

        message.reply({
          embeds: [helpEmbed],
          allowedMentions: { repliedUser: false },
        });

        return;
      }

      const command =
        client.commands.get(args[0].toLowerCase()) ||
        client.commands.find(
          (c) => c.aliases && c.aliases.includes(args[0].toLowerCase())
        );

      // This is what it sends when using the command with argument and it does not find the command
      if (!command) {
        message.reply({
          content: `No existe un comando llamado "${args[0]}"!`,
          allowedMentions: { repliedUser: false },
        });

        return;
      }

      const name = command?.name;
      const description = command?.description || "No descrpition provided";
      const usage = command?.usage || "No usage provided";
      const aliases = command?.aliases.toString() || "[]";
      const category = command?.category || "No category provided!";

      const helpCmdEmbed = new MessageEmbed()
        .setTitle(
          `${
            client.user?.username
          } Help | \`${name?.toLocaleString()}\` Command`
        )
        .addFields(
          { name: "Description", value: description },
          { name: "Usage", value: usage },
          { name: "Aliases", value: aliases.toString() },
          { name: "Category", value: category }
        )
        .setColor("RANDOM");

      message.reply({
        embeds: [helpCmdEmbed],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      logger(error);
    }
  },
};

export default pull;

import Discord, { CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "help",
  category: "info",
  description: "Muestra todos los comandos o un comando específico",
  ownerOnly: false,
  options: [
    {
      name: "command",
      description: "Comando a mostrar",
      type: MoreCommandTypes.STRING,
      required: false,
    },
  ],
  run: async (
    client: ClientDiscord,
    interaction: CommandInteraction,
    args: Argument[]
  ) => {
    try {
      const arg = args[0]?.value || null;

      if (!arg) {
        const commands = (category: string) => {
          return client.slashCommands
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
              name: `▫ ${cat[0].toUpperCase() + cat.slice(1)} Slash Commands`,
              value: `${commands(cat) || "No slash commands found"}`,
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
        const helpEmbed = new Discord.MessageEmbed()
          .setTitle(`${client.user?.username} Help`)
          .setDescription(
            ` Hola **<@${interaction.user.id}>**  \nPuedes usar \`${client.config.prefix}help <command>\` para ver más información de los comandos!
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

        interaction.reply({
          embeds: [helpEmbed],
          allowedMentions: { repliedUser: false },
        });

        return;
      }

      const command =
        client.commands.get(arg.toString().toLowerCase()) ||
        client.commands.find(
          (c) => c.aliases && c.aliases.includes(arg.toString().toLowerCase())
        );

      // This is what it sends when using the command with argument and it does not find the command
      if (!command) {
        interaction.reply({
          content: `No existe un comando llamado "${args[0].value}"!`,
          allowedMentions: { repliedUser: false },
        });

        return;
      }

      const name = command?.name;
      const description = command?.description || "No descrpition provided";
      const usage = command?.usage || "No usage provided";
      const aliases = command?.aliases.toString() || "[]";
      const category = command?.category || "No category provided!";

      const helpCmdEmbed = new Discord.MessageEmbed()
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

      interaction.reply({
        embeds: [helpCmdEmbed],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

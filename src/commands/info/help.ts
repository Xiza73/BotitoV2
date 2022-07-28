import { Message, EmbedBuilder, Client } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ICommand } from "../../shared/types/types";

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
    /* const row: ActionRowData<
      MessageActionRowComponentBuilder | MessageActionRowComponentData | AnyComponentBuilder
    > = {
      ...new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("GitHub")
          .setStyle(ButtonStyle.Link)
          .setURL("https://github.com/Xiza73/BotitoV2"),
        new ButtonBuilder()
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/4GgvywcG")
      ),
      type: ComponentType.ActionRow,
    }  */

    // Buttons that take you to a link for v14 discordjs

    if (client instanceof ClientDiscord) {
      if (!args[0]) {
        // Get all commands
        const commands = (category: string) => {
          return client.commands
            .filter((cmd) => cmd.category === category)
            .map((cmd) => `\`${cmd.name}\``)
            .join(", ");
        };

        const info: { name: string; value: string; inline: boolean }[] =
          client.categories.map((cat: string) => {
            return {
              name: `▫ ${cat[0].toUpperCase() + cat.slice(1)} Commands`,
              value: `${commands(cat)}`,
              inline: true,
            };
          });

        // This is what it commands when using the command without arguments
        const helpEmbed = new EmbedBuilder()
          .setTitle(`${client.user?.username} Help`)
          .setDescription(
            ` Hola **<@${message.author.id}>**  \nPuedes usar \`${client.config.prefix}help <command>\` para ver más información de los comandos!\n**Cantidad de comandos:** ${client.commands.size}\n**Cantidad de /comandos:** ${client.slashCommands.size}`
          )
          .setColor("Random")
          .addFields(info);

        message.reply({
          embeds: [helpEmbed],
          allowedMentions: { repliedUser: false },
          // components: [row],
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
          const command =
            client.commands.get(args[0].toLowerCase()) ||
            client.commands.find(
              (c) => c.aliases && c.aliases.includes(args[0].toLowerCase())
            );
          const name = command?.name;
          const description = command?.description || "No descrpition provided";
          const usage = command?.usage || "No usage provided";
          const aliases = command?.aliases || "No aliases provided";
          const category = command?.category || "No category provided!";

          const helpCmdEmbed = new EmbedBuilder()
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
            .setColor("Random");

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

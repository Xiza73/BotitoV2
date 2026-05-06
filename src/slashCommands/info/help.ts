import Discord, { ChatInputCommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ApplicationCommandOptionType } from "discord.js";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const pull: ISlashCommand = {
  name: "help",
  category: "info",
  description: "Muestra todos los slash commands o detalle de uno específico",
  ownerOnly: false,
  options: [
    {
      name: "command",
      description: "Slash command a mostrar en detalle",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const arg = (args[0]?.value as string | undefined)?.toLowerCase();

      if (!arg) {
        const categories = [
          ...new Set(
            client.slashCommands
              .map((cmd) => cmd.category)
              .filter((c): c is string => Boolean(c))
          ),
        ].sort();

        const fields = categories.map((cat) => ({
          name: `▫ ${capitalize(cat)}`,
          value:
            client.slashCommands
              .filter((cmd) => cmd.category === cat)
              .map((cmd) => `\`/${cmd.name}\``)
              .join(", ") || "—",
          inline: true,
        }));

        const helpEmbed = new Discord.EmbedBuilder()
          .setTitle(`${client.user?.username} Help`)
          .setDescription(
            `Hola **<@${interaction.user.id}>** — usá ` +
              "`/help command:<nombre>`" +
              ` para ver el detalle de un slash command.\n` +
              `**Total slash commands:** ${client.slashCommands.size}`
          )
          .setColor("Random")
          .addFields(fields);

        return interaction.reply({
          embeds: [helpEmbed],
          allowedMentions: { repliedUser: false },
        });
      }

      const command = client.slashCommands.get(arg);
      if (!command) {
        return interaction.reply({
          content: `No existe un slash command llamado "${args[0].value}".`,
          allowedMentions: { repliedUser: false },
          ephemeral: true,
        });
      }

      const helpCmdEmbed = new Discord.EmbedBuilder()
        .setTitle(`${client.user?.username} Help | /${command.name}`)
        .addFields(
          {
            name: "Descripción",
            value: command.description || "Sin descripción",
          },
          {
            name: "Categoría",
            value: command.category || "—",
          },
          {
            name: "Owner only",
            value: command.ownerOnly ? "Sí" : "No",
          }
        )
        .setColor("Random");

      return interaction.reply({
        embeds: [helpCmdEmbed],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

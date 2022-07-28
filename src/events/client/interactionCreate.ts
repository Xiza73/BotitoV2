import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";

module.exports = {
  name: "interactionCreate",
  type: "client",
  execute(interaction: CommandInteraction, client: ClientDiscord) {
    if (!interaction.command) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: "an Error" });

    if (command.ownerOnly) {
      if (interaction.user.id !== client.config.ownerId) {
        return interaction.reply({
          content: "Este comando es privado",
          ephemeral: true,
        });
      }
    }

    const args = [];

    for (const option of interaction.options.data) {
      if (option.type === ApplicationCommandOptionType.Subcommand) {
        if (option.name) args.push(option.name);
        option.options?.forEach((x) => {
          if (x.value) args.push(x.value);
        });
      } else if (option.value) args.push(option.value);
    }

    try {
      command.run(client, interaction, args);
    } catch (e: any) {
      interaction.reply({ content: e.message });
    }
  },
};

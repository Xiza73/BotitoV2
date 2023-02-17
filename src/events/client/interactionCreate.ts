import { CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { Argument, ISlashCommand } from "../../shared/types";

module.exports = {
  name: "interactionCreate",
  type: "client",
  execute(interaction: CommandInteraction, client: ClientDiscord) {
    if (!interaction.command) return;

    const command: ISlashCommand | undefined = client.slashCommands.get(
      interaction.commandName
    );
    if (!command) return interaction.reply({ content: "an Error" });

    if (command.ownerOnly) {
      if (interaction.user.id !== client.config.ownerId) {
        return interaction.reply({
          content: "Este comando es privado",
          ephemeral: true,
        });
      }
    }

    const args: Argument[] = [];

    interaction.options.data.forEach((option) => {
      if (option.name) {
        args.push({
          name: option.name,
          type: option.type as any,
          ...(option.value && { value: option.value }),
          ...(option.type === "SUB_COMMAND" && {
            args: option.options?.map((x) => ({
              name: x.name,
              type: x.type as any,
              value: x.value,
            })),
          }),
        });
      }
    });

    try {
      command.run(client, interaction, args);
    } catch (e: any) {
      interaction.reply({ content: e.message });
    }
  },
};

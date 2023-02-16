import { CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ISlashCommand } from "../../shared/types";

module.exports = {
  name: "interactionCreate",
  type: "client",
  execute(interaction: CommandInteraction, client: ClientDiscord) {
    console.log("interactionCreate");
    if (!interaction.command) return;
    console.log("interactionCreate2");

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

    const args: (string | number | true)[] = [];

    // for (const option of interaction.options.data) {
    /* for (const option of command?.commandOptions) {
      if (option.type === "SUB_COMMAND") {
        if (option.name) args.push(option.name);
        option.commandOptions?.forEach((x) => {
          if (x.value) args.push(x.value);
        });
      } else if (option.value) args.push(option.value);
    } */
    interaction.options.data.forEach((option) => {
      if (option.type === "SUB_COMMAND") {
        if (option.name) args.push(option.name);
        option.options?.forEach((x) => {
          if (x.value) args.push(x.value);
        });
      } else if (option.value) args.push(option.value);
    });

    try {
      command.run(client, interaction, args);
    } catch (e: any) {
      interaction.reply({ content: e.message });
    }
  },
};

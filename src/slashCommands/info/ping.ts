import Discord, { CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types/index";
import { errorHandler } from "../../shared/utils/helpers";
// Example of how to make a SlashCommand

const pull: ISlashCommand = {
  name: "ping",
  category: "Utility",
  description: "Check the bot's ping!",
  ownerOnly: false,
  options: [
    /* {
      name: "user",
      description: "The user to ping",
      type: "USER",
      required: false,
    } as UserApplicationCommandData, */
    {
      name: "color",
      description: "The color to ping",
      type: MoreCommandTypes.SUB_COMMAND,
      options: [
        {
          name: "red",
          description: "The color red",
          type: MoreCommandTypes.STRING,
          required: false,
        },
        {
          name: "blue",
          description: "The color blue",
          type: MoreCommandTypes.STRING,
          required: false,
        },
      ],
    },
    {
      name: "height",
      description: "The color to ping",
      type: MoreCommandTypes.SUB_COMMAND,
      options: [
        {
          name: "tall",
          description: "The color red",
          type: MoreCommandTypes.STRING,
          required: false,
        },
        {
          name: "short",
          description: "The color blue",
          type: MoreCommandTypes.STRING,
          required: false,
        },
      ],
    },
    /* {
      name: "number",
      description: "The number to ping",
      type: ApplicationCommandTypes.MESSAGE,
      required: false,
    } as MessageApplicationCommandData, */
  ],
  run: async (
    client: ClientDiscord,
    interaction: CommandInteraction,
    args: Argument[]
  ) => {
    try {
      console.log({ args });
      const msg = await interaction.channel?.send(`🏓 Pinging...`);

      const pingEmbed = new Discord.MessageEmbed()
        .setTitle(":signal_strength: Bot Ping")
        .addFields([
          {
            name: "Time",
            value: `${Math.floor(
              msg!.createdAt.getTime() - interaction.createdAt.getTime()
            )}ms`,
            inline: true,
          },
          {
            name: "API Ping",
            value: `${client.ws.ping}ms`,
            inline: true,
          },
        ])
        .setColor("RANDOM");
      await interaction.reply({ embeds: [pingEmbed] });

      await msg?.delete();
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

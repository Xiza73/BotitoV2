import Discord, {
  ApplicationCommandData,
  CommandInteraction,
  UserApplicationCommandData,
} from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ISlashCommand } from "../../shared/types";
import { ApplicationCommandDataResolvable } from "discord.js";

const pull: ISlashCommand = {
  name: "ping",
  category: "utility",
  description: "Check the bot's ping!",
  ownerOnly: false,
  options: [
    {
      name: "user",
      description: "The user to ping",
      type: ApplicationCommandTypes.USER,
      required: false,
    } as UserApplicationCommandData,
  ],
  run: async (
    client: ClientDiscord,
    interaction: CommandInteraction,
    args: (string | number | boolean)[]
  ) => {
    try {
      /* const sub = interaction.options.getSubcommand();
      console.log(sub); */
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
            name: "API2 Ping",
            value: `${client.ws.ping}ms`,
            inline: true,
          },
        ])
        .setColor("RANDOM");
      await interaction.reply({ embeds: [pingEmbed] });

      await msg?.delete();
    } catch (error) {
      console.log(error);
    }
  },
};

export default pull;

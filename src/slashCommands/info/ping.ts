import Discord, { ChatInputCommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "ping",
  category: "info",
  description: "Check the bot's ping!",
  ownerOnly: false,
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    _: Argument[]
  ) => {
    try {
      if (!interaction.channel?.isSendable()) return;
      const msg = await interaction.channel.send(`🏓 Pinging...`);

      const pingEmbed = new Discord.EmbedBuilder()
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
        .setColor("Random");
      await interaction.reply({ embeds: [pingEmbed] });

      await msg?.delete();
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

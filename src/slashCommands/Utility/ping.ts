import Discord, { CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
// Example of how to make a SlashCommand

module.exports = {
  name: "ping",
  category: "Utility",
  description: "Check the bot's ping!",
  run: async (client: ClientDiscord, interaction: CommandInteraction) => {
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

    await interaction.followUp({ embeds: [pingEmbed] });

    msg?.delete();
  },
};

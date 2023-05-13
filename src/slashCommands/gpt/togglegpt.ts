import Discord, { CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { Argument, ISlashCommand } from "../../shared/types/index";
import { errorHandler } from "../../shared/utils/helpers";
import { toggleGPTAllowedChannel } from "../../shared/utils/gptChannelsHandler";

const pull: ISlashCommand = {
  name: "togglegpt",
  category: "gpt",
  description: "Toggle the active channel for GPT messages",
  ownerOnly: false,
  options: [],
  run: async (
    _: ClientDiscord,
    interaction: CommandInteraction,
    __: Argument[]
  ) => {
    try {
      const channelId = interaction.channelId as string;

      const wasAllowed = await toggleGPTAllowedChannel(channelId);

      const embed = new Discord.MessageEmbed()
        .setColor("RANDOM")
        .setDescription(
          `Canal ${wasAllowed ? "`activado`" : "`desactivado`"} para GPTmi2`
        );
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

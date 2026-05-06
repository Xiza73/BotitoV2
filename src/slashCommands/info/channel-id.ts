import { ChatInputCommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ApplicationCommandOptionType } from "discord.js";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "channel-id",
  category: "info",
  description: "Muestra el id del canal",
  ownerOnly: false,
  options: [
    {
      name: "channel",
      description: "Canal a consultar (default: este)",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const channelId = (args[0]?.value as string) ?? interaction.channelId;

      return interaction.reply({
        content: `El canal es: <#${channelId}> con id ${channelId}`,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

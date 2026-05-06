import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "syntax",
  category: "info",
  description: "Sintaxis de los argumentos en los comandos",
  ownerOnly: false,
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    __: Argument[]
  ) => {
    try {
      const embed = new EmbedBuilder({
        color: 0x0099ff,
        title: "Sintaxis",
        description:
          "`<>` : obligatorio\n" +
          "`[]` : opcional\n" +
          "`(+)` : 1 a más\n" +
          "`(*)` : 0 a más",
      });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

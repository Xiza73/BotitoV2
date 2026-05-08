import {
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";

import ClientDiscord from "../../shared/classes/ClientDiscord";
import { Argument, ISlashCommand } from "../../shared/types";
import { reminder } from "../../shared/utils/birthdayReminder";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "cum",
  category: "mod",
  description: "[Owner] Dispara manualmente el saludo de cumpleaños del día",
  ownerOnly: true,
  examples: ["/cum"],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    _: Argument[]
  ) => {
    try {
      const { count } = await reminder(client);

      const message =
        count === 0
          ? "Hoy no es cumple de nadie registrado."
          : count === 1
            ? "Disparé **1** saludo."
            : `Disparé **${count}** saludos.`;

      return interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

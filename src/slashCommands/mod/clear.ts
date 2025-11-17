import Discord, { CommandInteraction, Permissions } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";
import config from "../../config";

const pull: ISlashCommand = {
  name: "clear",
  category: "mod",
  description: "Limpia el chat",
  ownerOnly: false,
  options: [
    {
      name: "amount",
      description: "Cantidad de mensajes a borrar",
      type: MoreCommandTypes.INTEGER,
      required: false,
    },
  ],
  run: async (
    client: ClientDiscord,
    interaction: CommandInteraction,
    args: Argument[]
  ) => {
    try {
      // Member doesn't have permissions
      if (
        !(interaction.member!.permissions as Readonly<Permissions>).has(
          "MANAGE_MESSAGES"
        )
      ) {
        return interaction.reply({
          content: "No tienes permisos para eliminar mensajes...",
          ephemeral: true,
        });
      }

      const arg = args[0]?.value || 1;

      // Check if args[0] is a number
      if (isNaN(parseInt(arg.toString())) || parseInt(arg.toString()) <= 0) {
        return interaction.reply({
          content:
            "Por favor selecciona una cantidad de mensajes a eliminar apropiada.",
          ephemeral: true,
        });
      }

      // Maybe the bot can't delete messages
      if (
        !(interaction.member?.permissions as Readonly<Permissions>).has(
          "MANAGE_MESSAGES"
        )
      ) {
        return interaction.reply({
          content: "No cuento con permisos para eliminar mensajes.",
          ephemeral: true,
        });
      }

      const amount = parseInt(arg.toString());
      if (!amount) {
        return interaction.reply({
          content: "Por favor selecciona una cantidad de mensajes a borrar.",
        });
      }

      const amountToDelete =
        amount > config.maxDeleteMessages ? config.maxDeleteMessages : amount;

      const channel: Discord.TextChannel = <Discord.TextChannel>(
        interaction.channel
      );

      channel
        .bulkDelete(amountToDelete, true)
        .then(async (deleted) => {
          await interaction.reply({
            content: `\`${deleted.size}\` mensajes borrados.`,
            ephemeral: true,
          });
        })
        .catch((err) => interaction.reply(`Error: ${err}`));
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

import Discord, { ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ApplicationCommandOptionType } from "discord.js";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";
import config from "../../config";

const pull: ISlashCommand = {
  name: "clear",
  category: "mod",
  description: "Limpia el chat",
  ownerOnly: false,
  defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
  options: [
    {
      name: "amount",
      description: "Cantidad de mensajes a borrar",
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      // Member doesn't have permissions
      if (
        !(interaction.member!.permissions as Readonly<PermissionsBitField>).has(
          PermissionFlagsBits.ManageMessages
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
        !(interaction.member?.permissions as Readonly<PermissionsBitField>).has(
          PermissionFlagsBits.ManageMessages
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

      await interaction.reply({
        content: "Limpiando chat...",
        ephemeral: true,
      });

      channel
        .bulkDelete(amountToDelete, true)
        .then(async (deleted) => {
          const notice = await channel.send(
            `\`${deleted.size}\` mensajes borrados.`
          );
          setTimeout(() => {
            notice.delete().catch(() => {});
          }, 5000);
        })
        .catch((err) =>
          interaction.editReply(`Error: ${err}`).catch(() => {})
        );
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

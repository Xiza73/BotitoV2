import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "say",
  category: "mod",
  description: "Botito repite lo que dices",
  ownerOnly: false,
  options: [
    {
      name: "message",
      description: "Texto a repetir",
      type: MoreCommandTypes.STRING,
      required: true,
    },
    {
      name: "as_embed",
      description: "Mandarlo como embed",
      type: MoreCommandTypes.BOOLEAN,
      required: false,
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      if (
        !(interaction.member?.permissions as Readonly<PermissionsBitField>)?.has(
          PermissionFlagsBits.ManageMessages
        )
      ) {
        return interaction.reply({
          content: "No tenés los permisos requeridos para usar este comando.",
          ephemeral: true,
        });
      }

      if (!interaction.channel?.isSendable()) {
        return interaction.reply({
          content: "Este canal no soporta envío de mensajes.",
          ephemeral: true,
        });
      }

      const text = args.find((a) => a.name === "message")?.value as string;
      const asEmbed =
        (args.find((a) => a.name === "as_embed")?.value as boolean) ?? false;

      await interaction.reply({ content: "Listo.", ephemeral: true });

      if (asEmbed) {
        const embed = new EmbedBuilder()
          .setDescription(text)
          .setColor("White");
        await interaction.channel.send({ embeds: [embed] });
      } else {
        await interaction.channel.send(text);
      }
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

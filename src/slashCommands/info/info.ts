import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "info",
  category: "info",
  description: "Info facherita",
  ownerOnly: false,
  run: async (
    client: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    _: Argument[]
  ) => {
    try {
      if (!interaction.guild) {
        return interaction.reply({
          content: "Este comando solo funciona en un servidor.",
          ephemeral: true,
        });
      }

      const admin = await client.users.fetch("214867785380003860", {
        cache: false,
      });
      const esclavo = await client.users.fetch("305545446892371969", {
        cache: false,
      });

      const embed = new EmbedBuilder({
        color: 0xff2d00,
        title: "Información del Servidor",
        author: {
          name: client.user!.username,
          icon_url: client.user!.avatarURL() ?? undefined,
        },
        thumbnail: {
          url: "https://miro.medium.com/max/768/1*YyDB9Hf4yD44RseexnTJdA.png",
        },
        fields: [
          { name: "Nombre:", value: interaction.guild.name },
          {
            name: "Descripción:",
            value: "Sáquenme de Latinoamérica, esto es no es una descripción",
          },
          {
            name: "Miembros:",
            value: `${interaction.guild.memberCount} miembros recontra activos`,
          },
          { name: "Admin:", value: `**<@${admin.id}>**`, inline: true },
          { name: "Esclavo:", value: `**<@${esclavo.id}>**`, inline: true },
        ],
        image: {
          url: "https://i.kym-cdn.com/photos/images/facebook/001/456/420/c1b.png",
        },
      });

      return interaction.reply({
        embeds: [embed],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

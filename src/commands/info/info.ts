import { Client, Message, MessageEmbed } from "discord.js";
import { ICommand } from "../../shared/types/types";

const pull: ICommand = {
  name: "info",
  category: "info",
  description: "Info facherita",
  usage: null,
  aliases: [],
  ownerOnly: false,
  run: async (client: Client, msg: Message, __: string[], _: string) => {
    const exampleEmbed = new MessageEmbed({
      color: 0xff2d00,
      title: "Información del Servidor",
      author: {
        name: client.user!.username,
        icon_url: client.user!.avatarURL()!,
      },
      thumbnail: {
        url: "https://miro.medium.com/max/768/1*YyDB9Hf4yD44RseexnTJdA.png",
      },
      fields: [
        {
          name: "Nombre:",
          value: msg.guild!.name,
        },
        {
          name: "Descripción:",
          value: "Sáquenme de Latinoamérica, esto es no es una descripción",
        },
        {
          name: "Miembros:",
          value: `${msg.guild!.memberCount} miembros recontra activos`,
        },
        {
          name: "Admin:",
          value: "Mágic0",
          inline: true,
        },
        {
          name: "Esclavo:",
          value: "Ludwig",
          inline: true,
        },
      ],
      image: {
        url: "https://i.kym-cdn.com/photos/images/facebook/001/456/420/c1b.png",
      },
    });

    msg.channel.send({
      embeds: [exampleEmbed],
    });
  },
};

export default pull;

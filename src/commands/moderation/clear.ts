import { Client, Message, TextChannel } from "discord.js";
import { ICommand } from "../../shared/types/types";

const pull: ICommand = {
  name: "clear",
  category: "moderation",
  description: "Limpia el chat",
  usage: "[cantidad]",
  aliases: [],
  run: async (__: Client, message: Message, args: string[], _: string) => {
    /* if (message.deletable) {
      message.delete();
    } */

    // Member doesn't have permissions
    if (!message.member!.hasPermission("MANAGE_MESSAGES")) {
      return message
        .reply("No tienes permisos para eliminar mensajes...")
        .then((m) =>
          m.delete({
            timeout: 5000,
          })
        );
    }

    // Check if args[0] is a number
    if (isNaN(parseInt(args[0])) || parseInt(args[0]) <= 0) {
      return message
        .reply(
          "Por favor selecciona una cantidad de mensajes a eliminar apropiada."
        )
        .then((m) =>
          m.delete({
            timeout: 5000,
          })
        );
    }

    // Maybe the bot can't delete messages
    if (!message.guild!.me!.hasPermission("MANAGE_MESSAGES")) {
      return message
        .reply("No cuento con permisos para eliminar mensajes.")
        .then((m) =>
          m.delete({
            timeout: 5000,
          })
        );
    }

    let deleteAmount;

    if (parseInt(args[0]) > 50) {
      deleteAmount = 50;
    } else {
      deleteAmount = parseInt(args[0]);
    }

    const channel: TextChannel = <TextChannel>message.channel;

    channel
      .bulkDelete(deleteAmount + 1, true)
      .then((deleted) =>
        message.channel
          .send(`\`${deleted.size - 1}\` mensajes borrados.`)
          .then((msg) => {
            msg.delete({ timeout: 5000 });
          })
          .catch((err) => message.reply(`Error: ${err}`))
      )
      .catch((err) => message.reply(`Error: ${err}`));
  },
};

export default pull;

import { Client, Message, TextChannel } from "discord.js";
import { ICommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils";
import config from "../../config";

const pull: ICommand = {
  name: "clear",
  category: "mod",
  description: "Limpia el chat",
  usage: "[cantidad]",
  aliases: ["clean", "purge"],
  ownerOnly: false,
  run: async (client: Client, message: Message, args: string[], _: string) => {
    try {
      // Member doesn't have permissions
      if (!message.member!.permissions.has("MANAGE_MESSAGES")) {
        return message
          .reply("No tienes permisos para eliminar mensajes...")
          .then((m) =>
            setTimeout(() => {
              m.delete();
            }, 5000)
          );
      }

      // Check if args[0] is a number
      if (isNaN(parseInt(args[0])) || parseInt(args[0]) <= 0) {
        return message
          .reply(
            "Por favor selecciona una cantidad de mensajes a eliminar apropiada."
          )
          .then((m) =>
            setTimeout(() => {
              m.delete();
            })
          );
      }

      // Maybe the bot can't delete messages
      if (!message.member?.permissions.has("MANAGE_MESSAGES")) {
        return message
          .reply("No cuento con permisos para eliminar mensajes.")
          .then((m) =>
            setTimeout(() => {
              m.delete();
            })
          );
      }

      let deleteAmount;

      if (parseInt(args[0]) > config.maxDeleteMessages) {
        deleteAmount = config.maxDeleteMessages;
      } else {
        deleteAmount = parseInt(args[0]);
      }

      const channel: TextChannel = <TextChannel>message.channel;

      channel
        .bulkDelete(deleteAmount + 1, true)
        .then(async (deleted) => {
          message.channel
            .send(`\`${deleted.size - 1}\` mensajes borrados.`)
            .then((msg) => {
              setTimeout(() => {
                msg.delete();
              });
            })
            .catch((err) => message.reply(`Error: ${err}`));
        })
        .catch((err) => message.reply(`Error: ${err}`));
    } catch (error) {
      errorHandler(message, error);
    }
  },
};

export default pull;

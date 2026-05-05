import { Client, EmbedBuilder, Message } from "discord.js";
import { ICommand } from "../../shared/types";
import * as userDao from "../../api/dao/user.dao";

const pull: ICommand = {
  name: "addmember",
  category: null,
  description: "Agrega un miembro a la base de datos de Gmi2",
  usage: "<name> <user> <dayBirthday> <monthBirthday>",
  aliases: ["add"],
  ownerOnly: false,
  run: async (client: Client, msg: Message<true>, args: string[], _: string) => {
    if (
      msg.member!.roles.highest.name !== "Staff" &&
      msg.member!.roles.highest.name !== "Admin"
    ) {
      msg.channel.send(`No tiene permisos para esta acción
      rol actual: ${msg.member!.roles.highest.name}
      rol requerido: Staff`);
      return;
    }
    if (!args[3]) {
      msg.channel.send(
        `Falta agregar datos\nSintaxis: <name> <user> <dayBirthday> <monthBirthday>`
      );
      return;
    }
    try {
      const mentions = msg.mentions.users.map((x) => x.id);
      if (!mentions)
        return msg.channel.send(
          `Falta segundo argumento\nSintaxis: <name> <user> <dayBirthday> <monthBirthday>`
        );
      const user = await client.users.fetch(mentions[0]);
      const data = await userDao.addUser({
        name: args[0],
        discordId: user.id,
        birthdayDay: args[2],
        birthdayMonth: args[3],
      });

      const embed = new EmbedBuilder({
        title: `Status: ${data.statusCode}`,
        description: data.message,
        timestamp: new Date(),
      }).setColor("Random");

      return msg.channel.send({ embeds: [embed] });
    } catch (error) {
      return msg.channel.send(`Error al crear usuario: ${error}`);
    }
  },
};

export default pull;

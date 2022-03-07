import { Client, Message, Util, MessageEmbedOptions } from "discord.js";
import { ICommand } from "../../shared/types/types";
import _config from "../../config/config";
import fetch from "cross-fetch";

const apiUrl = _config.api;

const pull: ICommand = {
  name: "addmember",
  category: null,
  description: "Agrega un miembro a la base de datos de Gmi2",
  usage: "<name> <user> <dayBirthday> <monthBirthday>",
  aliases: ["add"],
  ownerOnly: false,
  run: async (client: Client, msg: Message, args: string[], _: string) => {
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
      let mentions = msg.mentions.users.map((x) => x.id);
      if (!mentions)
        return msg.channel.send(
          `Falta segundo argumento\nSintaxis: <name> <user> <dayBirthday> <monthBirthday>`
        );
      const user = await client.users.fetch(mentions[0]);
      const body = {
        name: args[0],
        discordId: user.id,
        birthdayDay: args[2] ?? null,
        birthdayMonth: args[3] ?? null,
      };
      const response = await fetch(`${apiUrl}/api/user`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data: any = await response.json();

      const embed: MessageEmbedOptions = {
        color: "RANDOM",
        title: `Status: ${data.statusCode}`,
        description: data.message,
        timestamp: new Date(),
      };

      return msg.channel.send({ embeds: [embed] });
    } catch (error) {
      return msg.channel.send(`Error al crear usuario: ${error}`);
    }
  },
};

export default pull;

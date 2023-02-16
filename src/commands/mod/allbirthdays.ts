import { Client, MessageEmbed, Message, EmbedFieldData } from "discord.js";
import { CumData, ICommand, Month } from "../../shared/types";
import _config from "../../config";
import {
  getBirthdays,
  getBirthdaysByMonth,
} from "../../shared/services/birthday.service";
import calendar from "../../shared/constants/calendar";

const pull: ICommand = {
  name: "allbirthdays",
  category: null,
  description: "Obtener todos los cumpleaños",
  usage: "",
  aliases: ["allb", "allbirths", "cums"],
  ownerOnly: false,
  run: async (___: Client, msg: Message, args: string[], _: string) => {
    try {
      let response: CumData = {};
      const month: typeof NaN | Month = parseInt(args[0]) - 1;
      if (!isNaN(month)) {
        if (month < 0 || month > 11)
          return msg.channel.send({
            content: `El mes debe estar entre 1 y 12`,
          });
        response = await getBirthdaysByMonth(month);
        if (Object.keys(response).length === 0)
          return msg.channel.send({
            content: `No hay cumpleaños en ${calendar.months[month as Month]}`,
          });
      } else {
        response = await getBirthdays();
      }

      const embed = new MessageEmbed({
        title: "Cumpleaños 🎂",
        color: 0x00ff00,
      });

      const fields: EmbedFieldData[] = [];
      for (const res in response) {
        const birthdays = response[res];
        const users = birthdays.map(
          (birthday: any) =>
            ` \`${birthday.birthdayDay}\` <@${birthday.discordId}>`
        );
        users.sort((a: string, b: string) => {
          const dayA = parseInt(a.split(" ")[1].replace("`", ""));
          const dayB = parseInt(b.split(" ")[1].replace("`", ""));
          return dayA - dayB;
        });

        fields.push({ name: res, value: users.join("\n"), inline: true });
      }
      embed.addFields(fields);

      msg.channel.send({
        embeds: [embed],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      console.error(error);
    }
  },
};

export default pull;

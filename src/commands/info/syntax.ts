import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types";

const pull: ICommand = {
  name: "syntax",
  category: "info",
  usage: null,
  aliases: [],
  description: "Sintaxis de los comandos",
  ownerOnly: false,
  run: async (__: Client, message: Message, _: string[], ___: string) => {
    let s = "";
    s += `\`<>\` : obligatorio
      \`[]\` : opcional
      \`(+)\` : 1 a más
      \`(*)\` : 0 a más`;
    s += "\n";
    const exampleEmbed = {
      color: 0x0099ff,
      title: `Sintaxis`,
      description: s,
    };
    message.channel.send({ embeds: [exampleEmbed] });
  },
};

export default pull;

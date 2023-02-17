import { Message, MessageEmbed, Client } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { ICommand } from "../../shared/types";
import { stripIndents } from "common-tags";

const pull: ICommand = {
  name: "helpDeprecated",
  category: null,
  description: "Muestra todos los comandos o un comando específico",
  usage: `[command]`,
  aliases: [],
  ownerOnly: true,
  run: async (client: Client, message: Message, args: string[], _: string) => {
    if (client instanceof ClientDiscord)
      if (args[0]) {
        return getCMD(client, message, args[0]);
      } else {
        return getAll(client, message);
      }
  },
};

function getAll(client: ClientDiscord, message: Message) {
  const commands = (category: string) => {
    return client.commands
      .filter((cmd) => cmd.category === category)
      .map((cmd) => `\`${cmd.name}\``)
      .join(" ");
  };

  const info = client.categories
    .map(
      (cat: string) =>
        stripIndents`**${cat[0].toUpperCase() + cat.slice(1)}:** \n${commands(
          cat
        )}`
    )
    .reduce((string: string, category: string) => string + "\n\n" + category);

  const embed = new MessageEmbed()
    .setColor("RANDOM")
    .setTitle("Comandos")
    .setDescription(info);

  return message.channel.send({ embeds: [embed] });
}

function getCMD(client: ClientDiscord, message: Message, input: string) {
  const cmd =
    client.commands.get(input.toLowerCase()) ||
    client.commands.get(client.aliases.get(input.toLowerCase()));

  let info = `No hay información del comando **${input.toLowerCase()}**`;

  const embed = new MessageEmbed();
  if (!cmd) {
    return message.channel.send({
      embeds: [embed.setColor("RED").setDescription(info)],
    });
  }

  if (cmd.name) info = `**Comando**: ${cmd.name}`;
  if (cmd.description) info += `\n**Descripción**: ${cmd.description}`;
  if (cmd.usage) {
    info += `\n**Uso**: ${cmd.usage}`;
  }
  if (cmd.aliases) {
    info += `\n**Alias**: ${cmd.aliases}`;
  }

  return message.channel.send({
    embeds: [embed.setColor("GREEN").setDescription(info)],
  });
}

export default pull;

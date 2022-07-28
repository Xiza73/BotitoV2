import { Message } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { action } from "../../shared/utils/actions";

module.exports = {
  name: "messageCreate",
  type: "client",
  async execute(message: Message, client: ClientDiscord) {
    console.log(client.config.prefix);
    console.log(message.author.bot);
    console.log(message.content.toLowerCase());
    console.log(message.cleanContent);
    console.log(message);

    if (
      message.author.bot ||
      !message.guild ||
      !message.content.toLowerCase().startsWith(client.config.prefix)
    )
      return;

    const args: string[] = message.content
      .slice(client.config.prefix.length)
      .trim()
      .split(/ +/g);
    const cmd: string = args.shift()!.toLowerCase();
    if (cmd.length === 0) return;
    const command =
      client.commands.get(cmd) ||
      client.commands.find((c) => c.aliases?.includes(cmd.toLowerCase()));

    if (command) {
      if (command.ownerOnly) {
        if (message.author.id !== client.config.ownerId) {
          return message.reply({
            content: "Este comando es privado",
            allowedMentions: { repliedUser: false },
          });
        }
      }
      console.log("xd");

      await command.run(client, message, args, cmd);
    }

    if (cmd !== "") {
      console.log("v:");
      action(cmd, message);
    }
  },
};

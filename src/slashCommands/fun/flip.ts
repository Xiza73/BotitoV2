import Discord, { CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types/index";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "flip",
  category: "fun",
  description: "Flip a coin!",
  ownerOnly: false,
  options: [
    {
      name: "coins",
      description: "The number of coins to flip",
      type: MoreCommandTypes.NUMBER,
      required: false,
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: CommandInteraction,
    args: Argument[]
  ) => {
    try {
      const value: number = parseInt(args[0]?.value?.toString() || "1");
      const number =
        (args[0]?.value && (value > 10 ? 10 : value < 1 ? 1 : value)) || 1;
      const result = [];
      for (let i = 0; i < number; i++) {
        result.push(Math.random() < 0.5 ? "🧑 Heads" : "🛡️ Tails");
      }
      const embed = new Discord.MessageEmbed()
        .setColor("RANDOM")
        .setTitle("Coin Flip")
        .setDescription(result.join("\n"))
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });
      interaction.reply({ embeds: [embed] });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

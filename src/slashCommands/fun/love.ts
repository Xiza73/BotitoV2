import { ChatInputCommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler } from "../../shared/utils/helpers";

const pull: ISlashCommand = {
  name: "love",
  category: "fun",
  description: "Shipea >w<!",
  ownerOnly: false,
  options: [
    {
      name: "user1",
      description: "Primer shippeado",
      type: MoreCommandTypes.USER,
      required: true,
    },
    {
      name: "user2",
      description: "Segundo shippeado",
      type: MoreCommandTypes.USER,
      required: true,
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: ChatInputCommandInteraction,
    args: Argument[]
  ) => {
    try {
      const user1Id = args.find((a) => a.name === "user1")?.value as string;
      const user2Id = args.find((a) => a.name === "user2")?.value as string;

      return interaction.reply({
        content: `<@${user1Id}> y <@${user2Id}> se quieren, se besan :3 <3`,
        allowedMentions: { users: [] },
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

export default pull;

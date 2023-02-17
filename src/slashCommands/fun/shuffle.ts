import Discord, { CommandInteraction } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types/index";
import { errorHandler } from "../../shared/utils/helpers";

const OPTIONS = {
  words: "words",
  numbers: "numbers",
  list: "list",
  winners: "winners",
  quantity: "quantity",
} as const;

type OPTIONS_TYPES = (typeof OPTIONS)[keyof typeof OPTIONS];

const pull: ISlashCommand = {
  name: "shuffle",
  category: "fun",
  description: "Shuffle a list of words or numbers",
  ownerOnly: false,
  options: [
    {
      name: OPTIONS.words,
      description: "Shuffle a list of words",
      type: MoreCommandTypes.SUB_COMMAND,
      options: [
        {
          name: OPTIONS.list,
          description: "example: name1 name2 name3",
          type: MoreCommandTypes.STRING,
          required: true,
        },
        {
          name: OPTIONS.winners,
          description: "the number of winners",
          type: MoreCommandTypes.INTEGER,
          required: false,
        },
      ],
    },
    {
      name: OPTIONS.numbers,
      description: "Shuffle a list of numbers",
      type: MoreCommandTypes.SUB_COMMAND,
      options: [
        {
          name: OPTIONS.quantity,
          description: "the number of numbers to sort",
          type: MoreCommandTypes.INTEGER,
          required: true,
        },
      ],
    },
  ],
  run: async (
    _: ClientDiscord,
    interaction: CommandInteraction,
    args: Argument[]
  ) => {
    try {
      const subCommand = args[0];

      if (subCommand.name === OPTIONS.words) {
        let { list: value, winners } = subCommand.args!.reduce<
          Partial<Record<OPTIONS_TYPES, string | number | boolean>>
        >(
          (acc, cur) => {
            acc[cur.name as OPTIONS_TYPES] = cur.value;
            return acc;
          },
          { list: "" }
        );

        const list = (value as string)?.split(" ").map((item) => item.trim());
        winners = parseInt(winners?.toString() || list.length.toString());
        const shuffledList = complexShuffle(list);

        const embed = new Discord.MessageEmbed()
          .setColor("RANDOM")
          .setTitle("Shuffled List")
          .setDescription(enumerateArray(shuffledList, winners))
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          });

        interaction.reply({ embeds: [embed] });
      } else if (subCommand.name === OPTIONS.numbers) {
        let quantity = subCommand.args?.[0].value as number;
        if (quantity > 20) quantity = 20;
        if (quantity < 1) quantity = 1;
        const list = [];
        for (let i = 1; i <= quantity; i++) {
          list.push(i);
        }
        // const shuffledList = list.sort(() => Math.random() - 0.5);
        const shuffledList = complexShuffle(list);

        const embed = new Discord.MessageEmbed()
          .setColor("RANDOM")
          .setTitle("Shuffled List")
          .setDescription(shuffledList.join(", "))
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          });

        interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

const enumerateArray = (array: (string | number)[], winners: number) => {
  const slicedArray = array.slice(0, winners);
  let list = "";
  for (let i = 0; i < slicedArray.length; i++) {
    list += `${i + 1}. ${slicedArray[i]}\n`;
  }
  list = list.slice(0, -1);
  return list;
};

const complexShuffle = (array: (string | number)[]) => {
  // const shuffledArray = array.sort(() => Math.random() - 0.5); // This is the simple way to shuffle an array, but it's not complex enough
  // a more complex way to shuffle an array is to use the Fisher-Yates algorithm
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
};

export default pull;

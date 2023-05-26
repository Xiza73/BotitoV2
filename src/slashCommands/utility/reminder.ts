import { CommandInteraction, TextChannel } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import { MoreCommandTypes } from "../../shared/constants/commands";
import { Argument, ISlashCommand } from "../../shared/types";
import { errorHandler, rangeHandler } from "../../shared/utils/helpers";
import { onceCron } from "../../shared/classes/ScheduleMessage";
import { getDate } from "../../shared/utils";

const OPTIONS = {
  date: "date",
  hour: "hour",
  message: "message",
  minute: "minute",
  month: "month",
  spam: "spam",
} as const;

type OPTIONS_TYPES = (typeof OPTIONS)[keyof typeof OPTIONS];

const reminderOptions = [
  {
    name: "hour",
    description: "Hour of reminder",
    type: MoreCommandTypes.NUMBER,
    required: true,
  },
  {
    name: "minute",
    description: "Minute of reminder",
    type: MoreCommandTypes.NUMBER,
    required: true,
  },
  {
    name: "message",
    description: "Message of reminder",
    type: MoreCommandTypes.STRING,
    required: true,
  },
  {
    name: "month",
    description: "Month of reminder",
    type: MoreCommandTypes.NUMBER,
    required: false,
  },
  {
    name: "date",
    description: "Date of reminder",
    type: MoreCommandTypes.NUMBER,
    required: false,
  },
  {
    name: "spam",
    description: "Times to spam the reminder",
    type: MoreCommandTypes.NUMBER,
    required: false,
  },
];

const pull: ISlashCommand = {
  name: "reminder",
  category: "Utility",
  description: "Set a reminder",
  ownerOnly: false,
  options: [
    {
      name: "chat",
      description: "Send a reminder to a chat",
      type: MoreCommandTypes.SUB_COMMAND,
      options: reminderOptions,
    },
    {
      name: "dm",
      description: "Send a reminder to a dm",
      type: MoreCommandTypes.SUB_COMMAND,
      options: reminderOptions,
    },
  ],
  run: async (
    client: ClientDiscord,
    interaction: CommandInteraction,
    args: Argument[]
  ) => {
    try {
      const isDM = args[0]?.name === "dm";

      const { month, date, hour, minute, message, spam } = getArgs(args);

      const dateObj = getDate({
        city: "lima",
        hours: hour,
        minutes: minute,
        ...(date && { date }),
        ...(month && { month }),
      });

      const messages: string[] = [];
      for (let i = 0; i < parseInt((spam || 1)?.toString()); i++) {
        messages.push(message);
      }

      const sendMessage = async () => {
        if (isDM) {
          const userId = interaction.user.id;
          await Promise.all(
            messages.map(async (msg) => {
              await client.users.cache.get(userId)?.send(msg);
            })
          );
        } else {
          const channelId = interaction.channelId;
          await Promise.all(
            messages.map(async (msg) => {
              await (client.channels.cache.get(channelId) as TextChannel)?.send(
                msg
              );
            })
          );
        }
      };

      onceCron(sendMessage, dateObj.toDate());

      interaction.reply({
        content: "Reminder set",
        ephemeral: true,
      });
    } catch (error) {
      errorHandler(interaction, error);
    }
  },
};

const getArgs = (args: Argument[]) => {
  const { month, date, hour, minute, message, spam } =
    args?.[0]?.args?.reduce<
      Partial<Record<OPTIONS_TYPES, string | number | boolean>>
    >((acc, curr) => {
      acc[curr.name as OPTIONS_TYPES] = curr.value;
      return acc;
    }, {}) ?? {};

  const messagesToSend = rangeHandler(parseInt((spam || 1)?.toString()), 1, 10);
  const monthNumber = month
    ? rangeHandler(parseInt((month || 1)?.toString()), 1, 12)
    : undefined;
  const dateNumber = date
    ? rangeHandler(parseInt((date || 1)?.toString()), 1, 31)
    : undefined;
  const hourNumber = rangeHandler(parseInt((hour || 1)?.toString()), 0, 23);
  const minuteNumber = rangeHandler(parseInt((minute || 1)?.toString()), 0, 59);
  const messageToSend = message ? message.toString() : "";

  return {
    spam: messagesToSend,
    month: monthNumber,
    date: dateNumber,
    hour: hourNumber,
    minute: minuteNumber,
    message: messageToSend,
  };
};

export default pull;

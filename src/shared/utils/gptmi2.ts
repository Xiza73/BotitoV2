import { Message } from "discord.js";
import ClientDiscord from "../classes/ClientDiscord";
import { ResponseData } from "../../handlers/ResponseData";
import config from "../../config";
import { logger } from "./helpers";
import { getGPTChannelsInfo } from "./gptChannelsHandler";

const messageHistory: {
  user: string[];
  bot: string[];
} = {
  user: [],
  bot: [],
};

const MAX_MESSAGE_HISTORY = 4;
const chatBotUrl = "https://chatbot.theb.ai/api/chat-process";
let authorType: "user" | "bot" = "user";

const isGPTRequest = async (
  message: Message,
  client: ClientDiscord
): Promise<boolean> => {
  const { isChannelAllowed } = await getGPTChannelsInfo(message.channel.id);

  if (
    !isChannelAllowed ||
    message.author.bot ||
    message.content.toLowerCase().startsWith(client.config.prefix)
  )
    return false;

  return true;
};

const useFetch = async (
  prompt: string
): Promise<{
  reader: ReadableStreamDefaultReader<Uint8Array>;
  decoder: TextDecoder;
} | null> => {
  try {
    const res = await fetch(chatBotUrl, {
      method: "POST",
      headers: {
        authority: "chatbot.theb.ai",
        "content-type": "application/json",
        origin: "https://chatbot.theb.ai",
        "User-Agent": config.userAgent,
      },
      body: JSON.stringify({
        prompt,
      }),
      credentials: "include",
    });

    if (!res.ok) throw new Error();

    const reader = res.body!.getReader();
    const decoder = new TextDecoder("utf-8");

    return {
      reader,
      decoder,
    };
  } catch (error) {
    return null;
  }
};

const resolvePrompt = async (
  message: Message,
  prompt: string
): Promise<void> => {
  const res = await useFetch(prompt);
  if (!res) throw new Error();

  const { reader, decoder } = res;

  let responseFragment = "";
  let text = "";
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      if (responseFragment === "") {
        throw new Error();
      }

      await message.edit({
        content: text,
      });

      break;
    }

    responseFragment += decoder.decode(value);

    try {
      const parseableResponseFragment = `[${responseFragment
        .split("\n")
        .join(",")}]`;

      const json = JSON.parse(parseableResponseFragment);
      text = json[json.length - 1].text;

      await message.edit({
        content: text + " ⏳⌚",
      });
    } catch (error) {
      continue;
    }
  }
};

export const handler = async (
  message: Message,
  client: ClientDiscord
): Promise<void | Message<boolean>> => {
  let loadingMessage: Message | null = null;

  try {
    if (!(await isGPTRequest(message, client))) return;

    if (message.author.bot) authorType = "bot";

    messageHistory[authorType].push(message.content);
    messageHistory[authorType] = messageHistory[authorType].slice(
      -MAX_MESSAGE_HISTORY
    );

    const userHistory = messageHistory.user.join("\n");
    const botHistory = messageHistory.bot.join("\n");
    const prompt = `${userHistory}\n${botHistory}\nuser: ${message.content}\nbot:`;

    loadingMessage = await message.channel.send({
      content: "Generando...",
    });

    await resolvePrompt(loadingMessage, prompt);
  } catch (error) {
    logger("fetch error", error ? (error as Error).message : "unknown");

    const errorMesssage = {
      content: "No se pudo generar la respuesta",
    };

    return loadingMessage
      ? loadingMessage.edit(errorMesssage)
      : message.channel.send(errorMesssage);
  }
};

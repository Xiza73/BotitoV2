import * as fs from "./fileSystem";

const GPT_ALLOWED_CHANNELS_PATH = "./src/shared/data/gptAllowedChannels.txt";

const getChannelsFile = async (): Promise<string> => {
  try {
    const file = await fs.readFile(GPT_ALLOWED_CHANNELS_PATH);
    if (!file) throw new Error("No se pudo leer el archivo");

    return file;
  } catch (error) {
    return "";
  }
};

const getChannelsAllowed = async (): Promise<string[]> =>
  (await getChannelsFile()).split("\n");

export const getGPTChannelsInfo = async (
  channelId: string
): Promise<{
  channels: string[];
  isChannelAllowed: boolean;
}> => {
  const channels = await getChannelsAllowed();

  return {
    channels,
    isChannelAllowed: channels.includes(channelId),
  };
};

const writeChannels = async (channels: string[]): Promise<void> =>
  await fs.writeFile(GPT_ALLOWED_CHANNELS_PATH, channels.join("\n"));

export const toggleGPTAllowedChannel = async (
  channelId: string
): Promise<boolean> => {
  const { channels, isChannelAllowed } = await getGPTChannelsInfo(channelId);

  isChannelAllowed
    ? channels.splice(channels.indexOf(channelId), 1)
    : channels.push(channelId);

  await writeChannels(channels);

  return !isChannelAllowed;
};

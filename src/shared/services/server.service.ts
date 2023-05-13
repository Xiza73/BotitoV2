import axios from "axios";
import _config from "../../config";

const serverUrl = `${_config.api}/api/server`;

export const toggleGPTAllowedChannel = async (channelId: string) => {
  const response = await axios.post(`${serverUrl}/toggleGPTAllowedChannel`, {
    channelId,
  });
  return response.data || {};
};

export const isGPTAllowedChannel = async (channelId: string) => {
  const response = await axios.post(`${serverUrl}/isGPTAllowedChannel`, {
    channelId,
  });
  return response.data?.data || false;
};

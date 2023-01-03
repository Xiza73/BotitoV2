import axios from "axios";
import _config from "../../config";

const userUrl = `${_config.api}/api/user`;

export const getCurrentMessary = async (discordId: string) => {
  const response = await axios.get(
    `${userUrl}/getCurrentMessary?discordId=${discordId}`
  );
  return response.data?.data || 0;
};

export const updateMonth = async (discordId: string, month: number) => {
  const response = await axios.get(`${userUrl}/updateMonth?discordId=${discordId}&month=${month}`);
  return response.data?.data;
}

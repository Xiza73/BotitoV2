import * as userDao from "../../api/dao/user.dao";
import { ResponseData } from "../../handlers/ResponseData";

export const getUserById = async (discordId: string) => {
  const response = await userDao.readUserByDiscordId(discordId);

  if (response.statusCode !== 200) throw new Error(response.message);

  return (response as ResponseData).data;
};

export const getUserByName = async (name: string) => {
  const response = await userDao.readUserByName(name);

  if (response.statusCode !== 200) throw new Error(response.message);

  return (response as ResponseData).data;
};

export const getCurrentMessary = async (discordId: string) => {
  const response = await userDao.getCurrentMessary(discordId);

  if (response.statusCode !== 200) return 0;

  return (response as ResponseData).data;
};

export const updateMonth = async (discordId: string, month: number) => {
  const response = await userDao.updateMonth(discordId, month);

  if (response.statusCode !== 200) throw new Error(response.message);

  return (response as ResponseData).data;
};

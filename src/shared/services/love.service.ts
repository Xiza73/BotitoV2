import * as loveDao from "../../api/dao/love.dao";
import { ResponseData } from "../../handlers/ResponseData";
import { ILove } from "../../api/models/Love";

export const getOrCreatePair = async (
  id1: string,
  id2: string
): Promise<ILove | null> => {
  const response = await loveDao.getOrCreatePair(id1, id2);
  if (response.statusCode !== 200) return null;
  return (response as ResponseData).data as ILove;
};

export const setOverride = async (
  id1: string,
  id2: string,
  percentage: number,
  verdict: string | null,
  setBy: string
): Promise<ILove | null> => {
  const response = await loveDao.setOverride(
    id1,
    id2,
    percentage,
    verdict,
    setBy
  );
  if (response.statusCode !== 200) return null;
  return (response as ResponseData).data as ILove;
};

export const resetPair = async (
  id1: string,
  id2: string
): Promise<{ ok: boolean; statusCode: number; message: string }> => {
  const response = await loveDao.resetPair(id1, id2);
  return {
    ok: response.statusCode === 200,
    statusCode: response.statusCode,
    message: response.message,
  };
};

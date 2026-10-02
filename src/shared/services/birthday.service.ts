import * as birthdayDao from "../../api/dao/birthday.dao";
import { ResponseData } from "../../handlers/ResponseData";

export const getBirthdays = async () => {
  const response = await birthdayDao.getBirthdays();

  if (response.statusCode !== 200) return {};

  return (response as ResponseData).data;
};

export const getBirthdaysByMonth = async (month: number) => {
  const response = await birthdayDao.getBirthdaysByMonth(month);

  if (response.statusCode !== 200) return {};

  return (response as ResponseData).data;
};

export const getNextBirthday = async () => {
  const response = await birthdayDao.getNextBirthday();

  if (response.statusCode !== 200) return {};

  return (response as ResponseData).data;
};

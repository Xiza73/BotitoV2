import axios from "axios";
import _config from "../../config";

const birthdayUrl = `${_config.api}/api/birthday`;

export const getBirthdays = async () => {
  const response = await axios.get(`${birthdayUrl}/`);
  return response.data?.data || {};
};

export const getBirthdaysByMonth = async (month: number) => {
  const response = await axios.get(`${birthdayUrl}/month?month=${month}`);
  return response.data?.data || {};
};

export const getNextBirthday = async () => {
  const response = await axios.get(`${birthdayUrl}/next`);
  return response.data?.data || {};
};

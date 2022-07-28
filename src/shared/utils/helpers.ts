import { IDate, Param } from "../types/types";

export const random = (min: number, max: number) => {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
};

export const capitalize = (str: String) => {
  const arr = str.split(" ");

  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
  }

  return arr.join(" ");
};

export const setParams = (params: Param[]) => {
  let param = "?";
  params.forEach((p) => {
    param += p.name + "=" + p.value + "&";
  });
  param = param.substring(0, param.length - 1);
  return param;
};

export const dateToUTC5 = (date: Date) => {
  let day, hours, week;

  if (date.getUTCHours() < 5) {
    week = date.getDay() - 1;
    day = date.getUTCDate() - 1;
    hours = date.getUTCHours() + 19;
  } else {
    week = date.getDay();
    day = date.getUTCDate();
    hours = date.getUTCHours() - 5;
  }

  const utc5: IDate = {
    day,
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
    hours,
    minutes: date.getUTCMinutes(),
    week,
  };

  return utc5;
};

export const month: string[] = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Setiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

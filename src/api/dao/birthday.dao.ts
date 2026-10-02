import ErrorHandler from "../../handlers/ErrorHandler";
import ResponseData from "../../handlers/ResponseData";
import User, { IUser } from "../models/User";
import { capitalize } from "../../shared/utils/helpers";
import calendar from "../../shared/constants/calendar";
import { CumData, CumUser, Month } from "../../shared/types";
import { getNewDate } from "../../shared/utils/dayjs";

export const getBirthdays = async () => {
  try {
    const response = await User.find().sort({ birthdayMonth: 1 });
    const data = response.reduce((acc: CumData, user: IUser) => {
      const { name, discordId, birthdayDay, birthdayMonth } = user;
      if (!birthdayMonth) return acc;

      const month = capitalize(calendar.months[(birthdayMonth - 1) as Month]);
      const userBirthday: CumUser = { name, discordId, birthdayDay };

      if (!acc[month]) {
        acc[month] = [userBirthday];
      } else {
        acc[month].push(userBirthday);
      }

      return acc;
    }, {});

    return ResponseData(200, "Cumpleaños obtenidos correctamente", data);
  } catch (err) {
    return new ErrorHandler(404, "Error al obtener los cumpleaños");
  }
};

// month is 1-12, same as User.birthdayMonth.
export const getBirthdaysByMonth = async (month: number) => {
  try {
    if (!Number.isInteger(month) || month < 1 || month > 12)
      return new ErrorHandler(422, "El mes debe estar entre 1 y 12");

    const users = await User.find({ birthdayMonth: month });
    const monthWord = capitalize(calendar.months[(month - 1) as Month]);
    const data: CumData = users.length
      ? {
          [monthWord]: users.map(
            ({ name, discordId, birthdayDay }): CumUser => ({
              name,
              discordId,
              birthdayDay,
            })
          ),
        }
      : {};

    return ResponseData(200, "Cumpleaños obtenidos correctamente", data);
  } catch (err) {
    return new ErrorHandler(404, "Error al obtener los cumpleaños");
  }
};

export const getNextBirthday = async () => {
  try {
    const now = getNewDate("lima");
    const currentMonth = now.month() + 1;
    const currentDay = now.date();

    // getting all users with birthdayMonth and birthdayDay
    const response = await User.find({
      birthdayMonth: { $exists: true },
      birthdayDay: { $exists: true },
    });

    // filtering users with birthdayMonth and birthdayDay greater than current date
    const filteredUsers = response.filter((user) => {
      const { birthdayMonth, birthdayDay } = user;
      return (
        birthdayMonth! > currentMonth ||
        (birthdayMonth === currentMonth && birthdayDay! > currentDay)
      );
    });

    // sorting users by birthdayMonth and birthdayDay
    const sortedUsers = filteredUsers.sort((a, b) => {
      const { birthdayMonth: monthA, birthdayDay: dayA } = a;
      const { birthdayMonth: monthB, birthdayDay: dayB } = b;

      if (monthA === monthB) {
        return dayA! - dayB!;
      }

      return monthA! - monthB!;
    });

    // getting the next birthday
    const nextBirthday = sortedUsers[0];

    return ResponseData(
      200,
      "Próximo cumpleaños obtenido correctamente",
      nextBirthday
    );
  } catch (err) {
    return new ErrorHandler(404, "Error al obtener el próximo cumpleaños");
  }
};

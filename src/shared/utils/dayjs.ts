import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone"; // dependent on utc plugin
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";

/* CONFIG */

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const Timezone = {
  lima: "America/Lima",
} as const;

type TimezonePlaces = keyof typeof Timezone;

interface DateOptions {
  city: TimezonePlaces;
  date?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

const getTimezone = (city: TimezonePlaces) => Timezone[city];

/* EXPORTS */

export const getNewDate = (city: TimezonePlaces) =>
  dayjs(dayjs().utc().format("YYYY-MM-DDTHH:mm:ssZ")).tz(
    getTimezone(city),
    true
  );

export const getDate = ({
  city,
  date,
  hours,
  minutes,
  seconds = 0,
  milliseconds = 0,
}: DateOptions) => {
  let newDate = getNewDate(city)
    .set("seconds", seconds)
    .set("milliseconds", milliseconds);

  if (date) newDate = newDate.set("date", date);
  if (hours) newDate = newDate.set("hours", hours);
  if (minutes) newDate = newDate.set("minutes", minutes);

  return newDate;
};

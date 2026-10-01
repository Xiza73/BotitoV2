import { CronJob } from "cron";
import ClientDiscord from "./ClientDiscord";
import { claimCronRun } from "../../api/dao/cronRun.dao";
import { getNewDate } from "../utils/dayjs";
import { logger } from "../utils/helpers";

export default (
  name: string,
  message: (client: ClientDiscord) => unknown,
  client: ClientDiscord,
  options: {
    hour?: number | string;
    minute?: number | string;
    day?: number | string;
  }
) => {
  /*
      cron params: ss  mm  hh  dd  MM  ww
  */
  const { hour, minute, day } = options;

  // ponytail: one claim per Lima day — enough while every job runs at most daily.
  new CronJob(
    `10 ${minute || "0"} ${hour || "*"} ${day || "*"} * *`,
    async () => {
      try {
        const runKey = getNewDate("lima").format("YYYY-MM-DD");
        if (!(await claimCronRun(name, runKey))) return;
        await message(client);
      } catch (err) {
        logger(`[CRON] ${name} failed`, err);
      }
    },
    null,
    true,
    "America/Lima"
  );
};

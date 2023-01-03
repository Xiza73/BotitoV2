import { CronJob } from "cron";
import ClientDiscord from "./ClientDiscord";

export default (
  message: Function,
  client: ClientDiscord,
  options: {
    hour?: number | string;
    minute?: number | string;
    day?: number | string;
  }
) => {
  /*
      cron params: ss  mm  hh  dd  MM  ww
      start:       0   0-4 *   *   *   *
  */
  const { hour, minute, day } = options;

  const action = new CronJob(
    `10 ${minute || "0"} ${hour || "*"} ${day || "*"} * *`,
    () => {
      message(client);
    },
    null,
    true,
    "America/Lima"
  );

  action.start();
};

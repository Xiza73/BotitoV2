import { CronJob } from "cron";
import ClientDiscord from "./ClientDiscord";

export default (
  message: Function,
  client: ClientDiscord,
  hour: number | string,
  minute?: number | string
) => {
  /*
        cron params: ss mm hh dd MM ww
        start: 0 0-4 * * * *
    */
  const action = new CronJob(
    `10 ${minute || "0"} ${hour} * * *`,
    () => {
      message(client);
    },
    null,
    true,
    "America/Lima"
  );

  action.start();
};

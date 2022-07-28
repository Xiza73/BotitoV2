import { CronJob } from "cron";
import ClientDiscord from "./ClientDiscord";

export default (
  message: Function,
  client: ClientDiscord,
  hour: number,
  minute?: number
) => {
  /*
        cron params: ss mm hh dd MM ww
        start: 0 0-4 * * * *
    */
  const action = new CronJob(
    `0 ${minute || "54"} ${hour} * * *`,
    () => {
      message(client);
    },
    null,
    true,
    "America/Lima"
  );

  action.start();
};

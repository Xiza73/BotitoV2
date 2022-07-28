import { CronJob } from "cron";
import ClientDiscord from "./ClientDiscord";

export default class ScheduleMessage {
  public get action() {
    return this._action;
  }

  public get done() {
    return this._done;
  }

  public set done(done: boolean) {
    this._done = done;
  }

  private readonly _action: CronJob;
  private readonly _stopController: CronJob;
  private readonly _startController: CronJob;
  private _done: boolean;

  constructor(message: Function, client: ClientDiscord) {
    /*
        cron params: ss mm hh dd MM ww
        start: 0 0-4 * * * *
        end: 5 0-4 * * * *
        again: 10 4-8 * * * *
    */
    this._action = new CronJob(
      `0 0-4 0 * * *`,
      () => {
        message(client);
        this.done = true;
      },
      null,
      true,
      "America/Lima"
    );
    this._stopController = new CronJob(
      `0 5-9  * * *`,
      () => {
        if (this.done) this.action.stop();
      },
      null,
      true,
      "America/Lima"
    );
    this._startController = new CronJob(
      `10 4-8  * * * *`,
      () => {
        if (this.done) {
          this.action.start();
          this.done = false;
        }
      },
      null,
      true,
      "America/Lima"
    );
    this._stopController.start();
    this._startController.start();
    this._done = false;
  }
}

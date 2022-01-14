import { CronJob } from "cron";
import cron from "cron";
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
    this._action = new cron.CronJob("0 0-4 * * * *", () => {
      //console.log("message");
      message(client)
      this.done = true;
    });
    this._stopController = new cron.CronJob("5 0-4 * * * *", () => {
      if (this.done) this.action.stop();
    });
    this._startController = new cron.CronJob("10 4-8  * * * *", () => {
      if (this.done) {
        this.action.start();
        this.done = false;
      }
    });
    this._stopController.start();
    this._startController.start();
    this._done = false;
  }
}

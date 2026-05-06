import { Client, ClientOptions, Collection } from "discord.js";
import { ClientConfig, ISlashCommand } from "../types";

export default class ClientDiscord extends Client {
  public get slashCommands() {
    return this._slashCommands;
  }

  public get config() {
    return this._config;
  }

  public set config(cfg: ClientConfig) {
    this._config = cfg;
  }

  private readonly _slashCommands: Collection<string, ISlashCommand>;
  private _config: ClientConfig;

  constructor(options: ClientOptions, config: ClientConfig) {
    super(options);
    this._config = config;
    this._slashCommands = new Collection();
  }
}

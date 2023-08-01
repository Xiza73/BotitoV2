import { Client, ClientOptions, Collection } from "discord.js";
import { ClientConfig, ICommand, ISlashCommand } from "../types";
// import { DisTube } from "distube";

export default class ClientDiscord extends Client {
  public get commands() {
    return this._commands;
  }

  public get slashCommands() {
    return this._slashCommands;
  }

  public get aliases() {
    return this._aliases;
  }

  public get categories() {
    return this._categories;
  }

  public set categories(path: string[]) {
    this._categories = path;
  }

  public get distube() {
    return this._distube;
  }

  public set distube(dtube: any) {
    this._distube = dtube;
  }

  public get config() {
    return this._config;
  }

  public set config(cfg: ClientConfig) {
    this._config = cfg;
  }

  private readonly _commands: Collection<string, ICommand>;
  private readonly _slashCommands: Collection<string, ISlashCommand>;
  private readonly _aliases: Collection<string, any>;
  private _config: ClientConfig;
  private _categories: string[] = [];
  private _distube: any;

  constructor(options: ClientOptions, config: ClientConfig) {
    super(options);
    this._config = config;
    this._commands = new Collection();
    this._slashCommands = new Collection();
    this._aliases = new Collection();
  }
}

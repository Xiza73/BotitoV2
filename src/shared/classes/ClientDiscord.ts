import { Client, ClientOptions, Collection } from "discord.js";
import { ICommand } from "../types/types";

export default class ClientDiscord extends Client {
  public get commands() {
    return this._commands;
  }

  public get aliases() {
    return this._aliases;
  }
  
  public get categories() {
    return this._categories;
  }

  public set categories(path: any) {
    this._categories = path;
  }

  private readonly _commands: Collection<string, ICommand>;
  private readonly _aliases: Collection<string, any>;
  private _categories: any;

  constructor(options?: ClientOptions | undefined) {
    super(options);
    this._commands = new Collection();
    this._aliases = new Collection();
  }
}

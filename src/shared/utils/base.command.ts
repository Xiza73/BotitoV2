import { Client, Message } from "discord.js";
import { ICommand } from "../types";

const pull: ICommand = {
  name: "",
  category: null,
  description: "",
  usage: "",
  aliases: [],
  ownerOnly: false,
  run: async (__: Client, msg: Message<true>, args: string[]) => {},
};

export default pull;

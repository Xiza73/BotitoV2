import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";

const pull: ICommand = {
  name: "",
  category: null,
  description: "",
  usage: "",
  aliases: [],
  run: async (__: Client, msg: Message, args: string[]) => {
    
  },
};

export default pull;

import { Message, OmitPartialGroupDMChannel } from "discord.js";
import ClientDiscord from "../../shared/classes/ClientDiscord";
import * as gptmi2 from "../../shared/utils/gptmi2";

export default {
  name: "messageCreate",
  type: "client",
  async execute(message: Message, client: ClientDiscord) {
    if (message.channel.isDMBased() && !message.channel.isSendable()) return;
    gptmi2.handler(message as OmitPartialGroupDMChannel<Message>, client);
  },
};

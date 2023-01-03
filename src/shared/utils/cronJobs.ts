import { getCurrentMessary, updateMonth } from "./../services/user.service";
import { MessageEmbed } from "discord.js";
import ClientDiscord from "../classes/ClientDiscord";
import { ownerSender } from "./helpers";
import _config from "../../config";

export const messaryController = async (client: ClientDiscord) => {
  const currentMonth = await getCurrentMessary(_config.ownerId);
  await updateMonth(_config.ownerId, currentMonth + 1);
  const embed = new MessageEmbed()
    .setColor("RANDOM")
    .setTitle("Mesario con Michelly").setDescription(`
      Cumplen ${currentMonth + 1} meses como pareja
    `);

  await ownerSender(client, embed, true);
};

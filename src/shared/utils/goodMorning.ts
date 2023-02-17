import { MessageEmbed } from "discord.js";
import _config from "../../config";
import ClientDiscord from "../classes/ClientDiscord";
import images from "../constants/images";
import { IDate, Week } from "../types";
import { channelSender, dateToUTC5 } from "./helpers";

export const goodMorning = (client: ClientDiscord) => {
  const { week }: IDate = dateToUTC5(new Date());

  const embed = new MessageEmbed()
    .setColor(0xecff07)
    .setTitle("Buenos días estrellitas!")
    .setDescription("La tierra les dice holaaaaa")
    .setThumbnail(images.willy)
    .setImage(images.stars[week]);

  channelSender(client, _config.gmi2Channel, {
    embeds: [
      embed,
      thursdayEmbedController(week)!,
      fridayEmbedController(week)!,
    ].filter((e) => e),
  });
};

export const thursdayEmbedController = (
  week: Week
): MessageEmbed | undefined => {
  if (week !== 4) return;
  return new MessageEmbed()
    .setColor(0xf14d00)
    .setTitle("Feliz Jueves!")
    .setThumbnail(images.asukaThumbnail)
    .setImage(images.asukaGif);
};

export const fridayEmbedController = (week: Week): MessageEmbed | undefined => {
  if (week !== 5) return;
  return new MessageEmbed()
    .setColor(0x0099ff)
    .setTitle("PREPARATE LA PUTA QUE TE RE PARIÓ")
    .setDescription(
      `**Porque Los viernes de la jungla serán a todo ojete**
          todo ojete todo ojete; ojete, ojete, ojete
          **Para vivir una noche con las mejores putas de la zona**
          No te la podes perder hijo de re mil, porque si no estás allí; andate a la concha de la lora
          **Te esperamos para que vivas una noca de la puta madre**`
    )
    .setImage(images.fridayGif);
};

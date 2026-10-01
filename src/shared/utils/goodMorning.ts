import { EmbedBuilder } from "discord.js";
import _config from "../../config";
import ClientDiscord from "../classes/ClientDiscord";
import images from "../constants/images";
import { Week } from "../types";
import { getNewDate } from "./dayjs";
import { channelSender } from "./helpers";

export const goodMorning = async (client: ClientDiscord) => {
  const week = getNewDate("lima").day() as Week;

  const embed = new EmbedBuilder()
    .setColor(0xecff07)
    .setTitle("Buenos días estrellitas!")
    .setDescription("La tierra les dice holaaaaa")
    .setThumbnail(images.willy)
    .setImage(images.stars[week]);

  await channelSender(client, _config.gmi2Channel, {
    embeds: [
      embed,
      thursdayEmbedController(week)!,
      fridayEmbedController(week)!,
    ].filter((e) => e),
  });
};

export const thursdayEmbedController = (
  week: Week
): EmbedBuilder | undefined => {
  if (week !== 4) return;
  return new EmbedBuilder()
    .setColor(0xf14d00)
    .setTitle("Feliz Jueves!")
    .setThumbnail(images.asukaThumbnail)
    .setImage(images.asukaGif);
};

export const fridayEmbedController = (week: Week): EmbedBuilder | undefined => {
  if (week !== 5) return;
  return new EmbedBuilder()
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

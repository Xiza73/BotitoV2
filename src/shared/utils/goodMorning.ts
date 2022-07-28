import { Channel, EmbedBuilder } from "discord.js";
import _config from "../../config";
import ClientDiscord from "../classes/ClientDiscord";
import { IDate } from "../types/types";
import { dateToUTC5 } from "./helpers";

const root = _config.photodb;
const estrellitas = [
  "0.png",
  "1.gif",
  "2.gif",
  "3.gif",
  "4.png",
  "1.gif",
  "3.gif",
];

export const goodMorning = (client: ClientDiscord) => {
  const hoy: IDate = dateToUTC5(new Date());
  const gmi2Gaming: Channel | undefined = client.channels.cache.find(
    (channel) => channel.id === "752251099355938856"
  );
  const img = `${root}/estrellitas/${estrellitas[hoy.week]}`;

  const embed = new EmbedBuilder()
    .setColor(0xecff07)
    .setTitle("Buenos días estrellitas!")
    .setDescription("La tierra les dice holaaaaa")
    .setThumbnail(`${root}/willy.jpg`)
    .setImage(img);

  if (gmi2Gaming?.isTextBased()) {
    gmi2Gaming.send({ embeds: [embed] });
  }
  // Jueves
  if (hoy.week === 3) {
    const jEmbed = new EmbedBuilder({
      color: 0xf14d00,
      title: "Feliz Jueves!",
      image: {
        url: `${root}/asuka.gif`,
      },
      timestamp: new Date(),
    });

    if (gmi2Gaming?.isTextBased()) gmi2Gaming.send({ embeds: [jEmbed] });
  }
  // Viernes
  if (hoy.week === 5) {
    const vEmbed = new EmbedBuilder({
      color: 0x0099ff,
      title: "PREPARATE LA PUTA QUE TE RE PARIÓ",
      description: `**Porque Los viernes de la jungla serán a todo ojete**
          todo ojete todo ojete; ojete, ojete, ojete
          **Para vivir una noche con las mejores putas de la zona**
          No te la podes perder hijo de re mil, porque si no estás allí; andate a la concha de la lora
          **Te esperamos para que vivas una noche de la puta madre**`,
      image: {
        url: `${root}/viernes.gif`,
      },
      timestamp: new Date(),
    });

    if (gmi2Gaming?.isTextBased()) gmi2Gaming.send({ embeds: [vEmbed] });
  }
};

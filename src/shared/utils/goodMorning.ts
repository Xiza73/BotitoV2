import _config from "../../config/config";
import ClientDiscord from '../classes/ClientDiscord';
import { dateToUTC_5 } from "./helpers";

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
  const hoy = dateToUTC_5(new Date());
  const gmi2Gaming: any = client.channels.cache.find(
    (channel) => channel.id === "752251099355938856"
  );
  // 8 0 4
  if (hoy.hours === 8 && hoy.minutes >= 0 && hoy.minutes <= 4) {
    let img = `${root}/estrellitas/${estrellitas[hoy.week]}`;
    const embed = {
      color: 0xecff07,
      title: "Buenos días estrellitas!",
      description: `La tierra les dice holaaaaa`,
      thumbnail: {
        url: `${root}/willy.jpg`,
      },
      image: {
        url: img,
      },
      timestamp: hoy,
    };
    if (gmi2Gaming?.isText()) gmi2Gaming.send({ embed });
    //Jueves
    if (hoy.week == 4) {
      const jEmbed = {
        color: 0xf14d00,
        title: "Feliz Jueves!",
        image: {
          url: `${root}/asuka.gif`,
        },
        timestamp: new Date(),
      };

      if (gmi2Gaming?.isText()) gmi2Gaming.send({ embed: jEmbed });
    }
    //Viernes
    if (hoy.week == 5) {
      const exampleEmbed = {
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
      };

      if (gmi2Gaming?.isText()) gmi2Gaming.send({ embed: exampleEmbed });
    }
  }
};

import _config from "../config/config";
import client from "../discord";

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
const gmi2Gaming = client.channels.cache.find(
  (channel) => channel.id === "752251099355938856"
);

export const goodMorning = () => {
  let hoy = new Date();

  //Buenos días +5hours 0dom
  if (hoy.getHours() === 13 && hoy.getMinutes() >= 0 && hoy.getMinutes() <= 4) {
    let img = `${root}/estrellitas/${estrellitas[hoy.getDay()]}`;
    const myEmbed = {
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
    if (gmi2Gaming?.isText()) gmi2Gaming.send({ embed: myEmbed });
    //Jueves
    if (hoy.getDay() == 4) {
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
    if (hoy.getDay() == 5) {
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

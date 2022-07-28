import { Client, Message } from "discord.js";
import { ICommand } from "../../shared/types/types";
import { random } from "../../shared/utils/helpers";

const pull: ICommand = {
  name: "roll",
  category: "fun",
  description: `Tirar un(os) dado(s)\nLímite de tiros: 20\nLímite de caras: 100`,
  usage: "[<tiros>d<caras>]",
  aliases: [],
  ownerOnly: false,
  run: async (__: Client, msg: Message, args: string[], _: string) => {
    const root =
      "https://res.cloudinary.com/dnbgxu47a/image/upload/v1612837856";
    if (!args[0]) {
      const img = `${root}/d6/d${random(1, 6).toString()}.png`;
      msg.channel.send({ files: [img] });
    } else {
      const imgs = [];
      const pixelDices = [4, 6, 12];
      const text = args[0].split("d");
      let diceFaces = parseInt(text[1]);
      let throws = parseInt(text[0]);
      if (throws > 20) throws = 20;
      if (throws < 1) throws = 1;
      if (diceFaces > 100) diceFaces = 100;
      if (diceFaces < 2) diceFaces = 2;
      if (pixelDices.includes(diceFaces)) {
        const results: string[] = []; // controlador de repetidos
        for (let i = 0; i < throws; i++) {
          const r = random(1, diceFaces).toString();
          const img = `${root}/d${diceFaces.toString()}/d${r}.png`;
          // msg.channel.send(img); //sol chicha
          // Evita que se repita los dados porque no manda repetidos
          if (results.includes(r)) {
            msg.channel.send({ files: imgs });
            imgs.length = 0;
            results.length = 0;
          }
          results.push(r);
          imgs.push(img);
        }
        msg.channel.send({ files: imgs });
      } else {
        const results = [];
        for (let i = 0; i < throws; i++) {
          results.push(random(1, diceFaces));
        }
        msg.channel.send({ content: results.join(", ") });
      }
    }
  },
};

export default pull;

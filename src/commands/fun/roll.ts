import { Client, Message, MessageAttachment } from "discord.js";
import { ICommand } from "../../shared/types/types";
import { random } from "../../shared/utils/helpers";

const pull: ICommand = {
  name: "roll",
  category: "fun",
  description: `Tirar un(os) dado(s)\nLímite de tiros: 20\nLímite de caras: 100`,
  usage: "[<tiros>d<caras>]",
  aliases: [],
  run: async (__: Client, msg: Message, args: string[], _: string) => {
    const root =
      "https://res.cloudinary.com/dnbgxu47a/image/upload/v1612837856";
    if (args[0] === undefined) {
      const img = new MessageAttachment(
        `${root}/d6/d${random(1, 6).toString()}.png`
      );
      msg.channel.send(img);
      //msg.channel.send(`${random(1, 6)}`);
    } else {
      let imgs = [];
      const dados = [4, 6, 12];
      let text = args[0].split("d");
      let myDado = parseInt(text[1]);
      let tiros = parseInt(text[0]);
      if (tiros > 20) tiros = 20;
      if (tiros < 1) tiros = 1;
      if (myDado > 100) myDado = 100;
      if (myDado < 2) myDado = 2;
      if (dados.includes(myDado) === true) {
        let results = [];
        for (let i = 0; i < tiros; i++) {
          //console.log(i)
          let r = random(1, myDado).toString();
          let img = new MessageAttachment(
            `./multimedia/d${myDado.toString()}/d${r}.png`
          );
          //msg.channel.send(img); //sol chicha
          if (results.includes(r) === true) {
            msg.channel.send(imgs);
            imgs.length = 0;
            results.length = 0;
          }
          results.push(r);
          imgs.push(img);
        }
        //console.log(imgs);
        msg.channel.send(imgs);
      } else {
        let results = [];
        for (let i = 0; i < tiros; i++) {
          results.push(random(1, myDado));
        }
        msg.channel.send(results);
      }
    }
  },
};

export default pull;

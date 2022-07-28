import _config from "../../config";
import ClientDiscord from "../classes/ClientDiscord";
import fetch from "cross-fetch";
import { dateToUTC5 } from "./helpers";

const apiUrl = _config.api;

export const reminder = async (client: ClientDiscord) => {
  const hoy = dateToUTC5(new Date());
  const gmi2Gaming: any = client.channels.cache.find(
    (channel) => channel.id === "752251099355938856"
  );

  let res: any = await fetch(`${apiUrl}/api/user`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  res = await res.json();
  if (res.statusCode !== 200) return;

  const users: any = res.data;

  // 0 0 4
  if (hoy.hours === 0) {
    users.forEach(async (e: any) => {
      if (hoy.day === e.birthdayDay && hoy.month === e.birthdayMonth) {
        try {
          const user = await client.users.fetch(e.discordId);
          const embed = {
            color: "RANDOM",
            title: "GangBang al CUMpleañero! 🥳🎂🎉",
            description: `👑 Felicitaciones ${user.username}`,
            thumbnail: {
              url: user.avatarURL()!,
            },
            /* fields: [
                  {
                    name: "CUMpleaños",
                    value: `${res.data.birthdayDay} de ${
                      month[parseInt(res.data.birthdayMonth) - 1]
                    }`,
                  },
                ], */
            image: {
              // url: "https://frasesabias.com/wp-content/uploads/2019/10/gif-feliz-cumplea%C3%B1os-amiga-gatito.gif",
              url: "https://i.pinimg.com/736x/f8/28/57/f82857d4da012fba311ea8040e163d5e.jpg",
            },
            timestamp: new Date(),
          };
          if (gmi2Gaming?.isText()) gmi2Gaming.send({ embed });
        } catch (error) {
          console.log(error);
        }
      }
    });
  }
};

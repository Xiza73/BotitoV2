import _config from "../../config/config";
import ClientDiscord from "../classes/ClientDiscord";
import fetch from "cross-fetch";

const apiUrl = _config.api;

export const reminder = async (client: ClientDiscord) => {
  let hoy = new Date();
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

  //replit 5 0 4
  if (hoy.getHours() === 5 && hoy.getMinutes() >= 0 && hoy.getMinutes() <= 4) {
    users.forEach(async (e: any) => {
      if (
        hoy.getDate() === e.birthdayDay &&
        hoy.getMonth() === e.birthdayMonth - 1
      ) {
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
              url: "https://frasesabias.com/wp-content/uploads/2019/10/gif-feliz-cumplea%C3%B1os-amiga-gatito.gif",
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

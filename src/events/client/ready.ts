import ClientDiscord from "../../shared/classes/ClientDiscord";
import ScheduleMessage from "../../shared/classes/ScheduleMessage";
import { goodMorning } from "../../shared/utils/goodMorning";
import { reminder } from "../../shared/utils/birthdayReminder";

module.exports = {
  name: "ready",
  once: true,
  type: "client",
  execute(client: ClientDiscord) {
    ScheduleMessage(goodMorning, client, '8');
    ScheduleMessage(reminder, client, '7');
    // Puts an activity
    client.user!.setPresence({
      status: "online",
      activities: [
        {
          name: `${client.config.prefix}help`,
          type: "PLAYING",
        },
      ],
    });

    // Send a message on the console
    console.log(
      `[LOG] ${
        client.user!.username
      } is up!\n[LOG] Bot serving on Ready to serve in ${
        client.guilds.cache.size
      } servers\n[LOG] Bot serving ${client.users.cache.size} users`
    );
  },
};

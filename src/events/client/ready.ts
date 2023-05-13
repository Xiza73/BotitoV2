import ClientDiscord from "../../shared/classes/ClientDiscord";
import ScheduleMessage from "../../shared/classes/ScheduleMessage";
import { goodMorning } from "../../shared/utils/goodMorning";
import { reminder } from "../../shared/utils/birthdayReminder";
import { messaryController } from "../../shared/utils/cronJobs";
import { logger } from "../../shared/utils/helpers";

module.exports = {
  name: "ready",
  once: true,
  type: "client",
  execute(client: ClientDiscord) {
    ScheduleMessage(goodMorning, client, { hour: 8 });
    ScheduleMessage(reminder, client, { hour: 7 });
    ScheduleMessage(messaryController, client, { day: 7, hour: 22 });
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
    logger(
      `[LOG] ${
        client.user!.username
      } is up!\n[LOG] Bot serving on Ready to serve in ${
        client.guilds.cache.size
      } servers\n[LOG] Bot serving ${client.users.cache.size} users`
    );
  },
};

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/classes/ScheduleMessage", () => ({ default: vi.fn() }));
vi.mock("../../shared/utils/goodMorning", () => ({ goodMorning: vi.fn() }));
vi.mock("../../shared/utils/birthdayReminder", () => ({ reminder: vi.fn() }));
vi.mock("../../shared/utils/cronJobs", () => ({ messaryController: vi.fn() }));
vi.mock("../../shared/utils/helpers", () => ({ logger: vi.fn() }));

import ScheduleMessage from "../../shared/classes/ScheduleMessage";
import { logger } from "../../shared/utils/helpers";
import ready from "./ready";

const createReadyClient = () =>
  ({
    user: { username: "TestBot", setPresence: vi.fn() },
    config: { ownerId: "owner-1" },
    guilds: { cache: { size: 3 } },
    users: { cache: { size: 5 } },
  }) as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ready", () => {
  it("schedules the three cron-based reminders, sets the activity, and logs", () => {
    const client = createReadyClient();
    ready.execute(client);

    expect(ScheduleMessage).toHaveBeenCalledTimes(3);
    expect(client.user.setPresence).toHaveBeenCalledOnce();
    const presence = (client.user.setPresence as any).mock.calls[0][0];
    expect(presence.activities[0].name).toBe("/help");
    expect(logger).toHaveBeenCalled();
  });
});

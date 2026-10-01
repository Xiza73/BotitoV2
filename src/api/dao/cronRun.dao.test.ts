import { describe, expect, it } from "vitest";

import { setupInMemoryMongo } from "../../test-utils/setup-mongo";
import Setting from "../models/Settings";
import { claimCronRun } from "./cronRun.dao";

setupInMemoryMongo();

describe("claimCronRun", () => {
  it("lets only the first claim per job/runKey through", async () => {
    await Setting.syncIndexes();
    const results = await Promise.all([
      claimCronRun("reminder", "2026-10-01"),
      claimCronRun("reminder", "2026-10-01"),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await claimCronRun("reminder", "2026-10-01")).toBe(false);
  });

  it("claims again on a new runKey and keeps jobs independent", async () => {
    await Setting.syncIndexes();
    expect(await claimCronRun("reminder", "2026-10-01")).toBe(true);
    expect(await claimCronRun("goodMorning", "2026-10-01")).toBe(true);
    expect(await claimCronRun("reminder", "2026-10-02")).toBe(true);
  });
});

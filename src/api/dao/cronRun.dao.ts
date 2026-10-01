import Setting from "../models/Settings";

/**
 * Atomically claims `job` for `runKey` (e.g. the Lima date). Returns false if
 * another process already claimed it — Railway overlaps the old and new
 * container during a redeploy, so both would fire the same cron.
 */
export const claimCronRun = async (
  job: string,
  runKey: string,
): Promise<boolean> => {
  try {
    await Setting.findOneAndUpdate(
      { key: `cron:${job}`, value: { $ne: runKey } },
      { value: runKey },
      { upsert: true },
    );
    return true;
  } catch (err: any) {
    // Filter missed because value === runKey → upsert collides on unique key.
    if (err?.code === 11000) return false;
    throw err;
  }
};

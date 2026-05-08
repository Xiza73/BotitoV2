import { MessageFlags } from "discord.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/utils/birthdayReminder");

import * as birthdayReminder from "../../shared/utils/birthdayReminder";
import {
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import cum from "./cum";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("/cum", () => {
  it("calls reminder() and reports the count back to the moderator (ephemeral)", async () => {
    vi.mocked(birthdayReminder.reminder).mockResolvedValue({ count: 2 });
    const interaction = createMockInteraction();

    await cum.run(createMockClient(), interaction, []);

    expect(birthdayReminder.reminder).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("**2** saludos");
  });

  it("uses singular 'saludo' when only one greeting fired", async () => {
    vi.mocked(birthdayReminder.reminder).mockResolvedValue({ count: 1 });
    const interaction = createMockInteraction();

    await cum.run(createMockClient(), interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.content).toContain("**1** saludo");
    expect(payload.content).not.toContain("saludos");
  });

  it("returns a friendly notice when no birthday matches today", async () => {
    vi.mocked(birthdayReminder.reminder).mockResolvedValue({ count: 0 });
    const interaction = createMockInteraction();

    await cum.run(createMockClient(), interaction, []);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("nadie");
  });

  it("is marked owner-only at the schema level", () => {
    expect(cum.ownerOnly).toBe(true);
  });
});

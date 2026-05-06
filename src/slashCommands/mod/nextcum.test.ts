import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/services/birthday.service");

import * as birthdayService from "../../shared/services/birthday.service";
import { createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import nextcum from "./nextcum";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/nextcum", () => {
  it("fetches the user and replies with the upcoming-birthday embed", async () => {
    vi.mocked(birthdayService.getNextBirthday).mockResolvedValue({
      name: "Diego",
      discordId: "111",
      birthdayDay: 17,
      birthdayMonth: 2,
    });

    const interaction = createMockInteraction();
    const client = createMockClient();
    await nextcum.run(client, interaction, []);

    expect(client.users.fetch).toHaveBeenCalledWith("111");
    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
  });

  it("replies ephemerally when no birthday is registered", async () => {
    vi.mocked(birthdayService.getNextBirthday).mockResolvedValue({} as any);

    const interaction = createMockInteraction();
    await nextcum.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.ephemeral).toBe(true);
  });
});

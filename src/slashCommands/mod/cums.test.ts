import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/services/birthday.service");

import * as birthdayService from "../../shared/services/birthday.service";
import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import cums from "./cums";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/cums", () => {
  it("replies with all birthdays when no month option is given", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue({
      Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
    });

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, []);

    expect(birthdayService.getBirthdays).toHaveBeenCalledOnce();
    expect(birthdayService.getBirthdaysByMonth).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("filters by month when the option is provided", async () => {
    vi.mocked(birthdayService.getBirthdaysByMonth).mockResolvedValue({
      Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
    });

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, [arg("month", 2)]);

    expect(birthdayService.getBirthdaysByMonth).toHaveBeenCalledWith(1); // month - 1
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("rejects ephemerally when the month option is out of range", async () => {
    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, [arg("month", 13)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.ephemeral).toBe(true);
  });

  it("returns the empty-state notice when the filter has no results", async () => {
    vi.mocked(birthdayService.getBirthdaysByMonth).mockResolvedValue({});

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, [arg("month", 2)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.ephemeral).toBe(true);
    expect(payload.content).toContain("No hay cumpleaños");
  });
});

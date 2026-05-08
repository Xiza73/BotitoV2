import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/services/birthday.service");

import * as birthdayService from "../../shared/services/birthday.service";
import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import cums from "./cums";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/cums", () => {
  it("replies with all birthdays when no month option is given", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue({
      Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
      Mayo: [{ name: "Ana", discordId: "222", birthdayDay: 5 }],
    });

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, []);

    expect(birthdayService.getBirthdays).toHaveBeenCalledOnce();
    expect(birthdayService.getBirthdaysByMonth).not.toHaveBeenCalled();
    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("🎂 Cumpleaños del servidor");
    expect(embed.description).toContain("**2** personas registradas");
  });

  it("filters by month when the option is provided (passes 0-indexed month to the service)", async () => {
    vi.mocked(birthdayService.getBirthdaysByMonth).mockResolvedValue({
      Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
    });

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, [arg("month", 2)]);

    expect(birthdayService.getBirthdaysByMonth).toHaveBeenCalledWith(1); // Feb is 0-indexed 1
    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("🎂 Cumpleaños de Febrero");
  });

  it("singular phrasing for a 1-person registration", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue({
      Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
    });

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.description).toBe("**1** persona registrada");
  });

  it("rejects ephemerally when the month option is out of range (>12)", async () => {
    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, [arg("month", 13)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("entre 1 y 12");
    expect(birthdayService.getBirthdaysByMonth).not.toHaveBeenCalled();
  });

  it("rejects ephemerally when the month option is 0 or negative", async () => {
    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, [arg("month", 0)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("returns a branded empty embed when the filter has no results", async () => {
    vi.mocked(birthdayService.getBirthdaysByMonth).mockResolvedValue({});

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, [arg("month", 2)]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("🎂 Sin cumpleaños en Febrero");
    expect(embed.description).toContain("No hay cumpleaños");
  });

  it("returns a friendly embed when there are no registrations at all", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue({});

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("🎂 Sin cumpleaños registrados");
    expect(embed.description).toContain("/register");
  });

  it("uses mod-red color and the brand footer (no setAuthor)", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue({
      Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
    });

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.color).toBe(0xed4245);
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.author).toBeUndefined();
  });

  it("ephemeral when private:true", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue({
      Febrero: [{ name: "Diego", discordId: "111", birthdayDay: 17 }],
    });

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, [arg("private", true)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("sorts by day within a month", async () => {
    vi.mocked(birthdayService.getBirthdays).mockResolvedValue({
      Febrero: [
        { name: "Carla", discordId: "333", birthdayDay: "20" },
        { name: "Diego", discordId: "111", birthdayDay: "5" },
        { name: "Ana", discordId: "222", birthdayDay: "12" },
      ],
    });

    const interaction = createMockInteraction();
    await cums.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    const febField = embed.fields.find((f: any) => f.name === "Febrero");
    const value = febField.value;
    // Order: 5, 12, 20
    const indexOf5 = value.indexOf("`5`");
    const indexOf12 = value.indexOf("`12`");
    const indexOf20 = value.indexOf("`20`");
    expect(indexOf5).toBeLessThan(indexOf12);
    expect(indexOf12).toBeLessThan(indexOf20);
  });
});

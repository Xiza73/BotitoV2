import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import uptime from "./uptime";

describe("/uptime", () => {
  it("renders a branded embed with formatted uptime and a relative-time start", async () => {
    const interaction = createMockInteraction();
    await uptime.run(createMockClient(), interaction, []);

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("⏰ Uptime");
    expect(embed.color).toBe(0x5865f2);
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.description).toMatch(/`[\dsmhd ]+`/);

    const startedField = embed.fields.find(
      (f: any) => f.name === "🚀 Activo desde"
    );
    expect(startedField.value).toMatch(/^<t:\d+:R>$/);
  });

  it("public by default, ephemeral when private:true", async () => {
    const i1 = createMockInteraction();
    await uptime.run(createMockClient(), i1, []);
    expect(i1.reply.mock.calls[0][0].flags).toBeUndefined();

    const i2 = createMockInteraction();
    await uptime.run(createMockClient(), i2, [arg("private", true)]);
    expect(i2.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
  });
});

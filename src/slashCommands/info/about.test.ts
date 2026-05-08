import { MessageFlags } from "discord.js";
import { describe, expect, it } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import about from "./about";

describe("/about", () => {
  it("renders an info-color embed with version, stack, and repo link", async () => {
    const interaction = createMockInteraction();
    await about.run(createMockClient(), interaction, []);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toMatch(/Xiza Bot/);
    expect(embed.color).toBe(0x5865f2); // info blurple
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);

    const fieldNames = embed.fields.map((f: any) => f.name);
    expect(fieldNames).toContain("📦 Versión");
    expect(fieldNames).toContain("⚙️ Stack");
    expect(fieldNames).toContain("🔗 Código");
  });

  it("public by default, ephemeral when private:true", async () => {
    const i1 = createMockInteraction();
    await about.run(createMockClient(), i1, []);
    expect(i1.reply.mock.calls[0][0].flags).toBeUndefined();

    const i2 = createMockInteraction();
    await about.run(createMockClient(), i2, [arg("private", true)]);
    expect(i2.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
  });
});

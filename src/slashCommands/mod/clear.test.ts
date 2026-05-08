import { MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import {
  arg,
  createMockClient,
  createMockInteraction,
} from "../../test-utils/discord-mocks";
import clear from "./clear";

describe("/clear", () => {
  it("bulk-deletes the requested amount, replies ephemerally with the count, and posts a public auto-deleting notice", async () => {
    vi.useFakeTimers();
    const noticeDelete = vi.fn().mockResolvedValue(undefined);
    const send = vi.fn().mockResolvedValue({ delete: noticeDelete });
    const bulkDelete = vi.fn().mockResolvedValue({ size: 4 });
    const interaction = createMockInteraction({
      channel: { isSendable: () => true, send, bulkDelete },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    expect(bulkDelete).toHaveBeenCalledWith(4, true);

    // Ephemeral reply with branded embed
    const replyPayload = interaction.reply.mock.calls[0][0];
    expect(replyPayload.flags).toBe(MessageFlags.Ephemeral);
    expect(replyPayload.embeds[0].data.title).toBe("🧹 Chat limpiado");
    expect(replyPayload.embeds[0].data.description).toContain("4");

    // Public notice posted to channel
    expect(send).toHaveBeenCalledOnce();
    const sentEmbed = send.mock.calls[0][0].embeds[0].data;
    expect(sentEmbed.title).toBe("🧹 Chat limpiado");
    expect(sentEmbed.color).toBe(0xed4245); // mod red
    expect(sentEmbed.footer.text).toMatch(/Xiza Bot v\d+/);

    // After 5s, the public notice deletes itself
    await vi.advanceTimersByTimeAsync(5_000);
    expect(noticeDelete).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("uses singular phrasing for a 1-message delete", async () => {
    const send = vi.fn().mockResolvedValue({ delete: vi.fn() });
    const bulkDelete = vi.fn().mockResolvedValue({ size: 1 });
    const interaction = createMockInteraction({
      channel: { isSendable: () => true, send, bulkDelete },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 1)]);

    const description = send.mock.calls[0][0].embeds[0].data.description;
    // Singular: '... **1** mensaje.' — no trailing 's' on 'mensaje'
    expect(description).toMatch(/\*\*1\*\*\s+mensaje\.$/);
  });

  it("rejects ephemerally when the member lacks ManageMessages", async () => {
    const interaction = createMockInteraction({
      member: { permissions: { has: vi.fn().mockReturnValue(false) } },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("permisos");
  });

  it("rejects ephemerally when amount is zero or negative", async () => {
    const interaction = createMockInteraction();
    await clear.run(createMockClient(), interaction, [arg("amount", 0)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("mayor a 0");
  });

  it("replies with an error embed when bulkDelete throws (eg. messages too old)", async () => {
    const bulkDelete = vi
      .fn()
      .mockRejectedValue(new Error("You can only bulk delete messages younger than 14 days"));
    const interaction = createMockInteraction({
      channel: { isSendable: () => true, send: vi.fn(), bulkDelete },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.embeds[0].data.title).toBe("❌ No se pudo limpiar el chat");
    expect(payload.embeds[0].data.description).toContain("14 days");
  });
});

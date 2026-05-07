import { MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import { arg, createMockClient, createMockInteraction } from "../../test-utils/discord-mocks";
import clear from "./clear";

describe("/clear", () => {
  it("bulk-deletes the requested amount and posts a public count notice", async () => {
    const send = vi.fn().mockResolvedValue({ delete: vi.fn() });
    const bulkDelete = vi.fn().mockResolvedValue({ size: 4 });
    const interaction = createMockInteraction({
      channel: {
        isSendable: () => true,
        send,
        bulkDelete,
      },
    });

    await clear.run(createMockClient(), interaction, [arg("amount", 4)]);

    expect(bulkDelete).toHaveBeenCalledWith(4, true);
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

  it("rejects ephemerally when amount is invalid (zero or negative)", async () => {
    const interaction = createMockInteraction();
    await clear.run(createMockClient(), interaction, [arg("amount", 0)]);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });
});

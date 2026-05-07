import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../shared/services/love.service");

import * as loveService from "../../shared/services/love.service";
import {
  arg,
  createMockClient,
  createMockInteraction,
  subCommandArg,
} from "../../test-utils/discord-mocks";
import love from "./love";

beforeEach(() => {
  vi.clearAllMocks();
});

const findField = (embed: any, name: string) =>
  embed.data.fields.find((f: any) => f.name === name);

describe("/love ship", () => {
  it("queries the service, replies with embed, suppresses pings", async () => {
    vi.mocked(loveService.getOrCreatePair).mockResolvedValue({
      pairKey: "111-222",
      user1: "111",
      user2: "222",
      percentage: 73,
      verdict: null,
      isOverride: false,
    } as any);

    const interaction = createMockInteraction();
    await love.run(createMockClient(), interaction, [
      subCommandArg("ship", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
      ]),
    ]);

    expect(loveService.getOrCreatePair).toHaveBeenCalledWith("111", "222");
    expect(interaction.reply).toHaveBeenCalledOnce();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.allowedMentions).toEqual({ users: [] });
    const embed = payload.embeds[0];
    expect(embed.data.title).toBe("💘 Shipping");
    expect(findField(embed, "💯 Compatibilidad").value).toContain("73%");
  });

  it("uses the stored verdict when it's an override", async () => {
    vi.mocked(loveService.getOrCreatePair).mockResolvedValue({
      percentage: 100,
      verdict: "Tortolitos del server 💞",
      isOverride: true,
    } as any);

    const interaction = createMockInteraction();
    await love.run(createMockClient(), interaction, [
      subCommandArg("ship", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
      ]),
    ]);

    const embed = interaction.reply.mock.calls[0][0].embeds[0];
    expect(findField(embed, "💌 Veredicto").value).toBe(
      "Tortolitos del server 💞"
    );
  });

  it("self-ship: 100% with the self-love phrase, doesn't hit the service", async () => {
    const interaction = createMockInteraction();
    await love.run(createMockClient(), interaction, [
      subCommandArg("ship", [
        { name: "user1", value: "solo-user" },
        { name: "user2", value: "solo-user" },
      ]),
    ]);

    expect(loveService.getOrCreatePair).not.toHaveBeenCalled();
    const embed = interaction.reply.mock.calls[0][0].embeds[0];
    expect(findField(embed, "💯 Compatibilidad").value).toContain("100%");
    expect(findField(embed, "💌 Veredicto").value).toContain("amor propio");
  });

  it("ephemeral when private:true", async () => {
    vi.mocked(loveService.getOrCreatePair).mockResolvedValue({
      percentage: 50,
      verdict: null,
    } as any);
    const interaction = createMockInteraction();
    await love.run(createMockClient(), interaction, [
      subCommandArg("ship", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
        { name: "private", value: true },
      ]),
    ]);
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("public by default", async () => {
    vi.mocked(loveService.getOrCreatePair).mockResolvedValue({
      percentage: 50,
      verdict: null,
    } as any);
    const interaction = createMockInteraction();
    await love.run(createMockClient(), interaction, [
      subCommandArg("ship", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
      ]),
    ]);
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBeUndefined();
  });
});

describe("/love set (owner-only)", () => {
  it("rejects non-owner with an ephemeral notice", async () => {
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const interaction = createMockInteraction({ user: { id: "intruder" } });
    await love.run(client, interaction, [
      subCommandArg("set", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
        { name: "percentage", value: 95 },
      ]),
    ]);
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("owner");
    expect(loveService.setOverride).not.toHaveBeenCalled();
  });

  it("calls the service and replies ephemeral by default for owner", async () => {
    vi.mocked(loveService.setOverride).mockResolvedValue({
      percentage: 95,
      verdict: "Custom",
      isOverride: true,
    } as any);
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const interaction = createMockInteraction({ user: { id: "owner-1" } });
    await love.run(client, interaction, [
      subCommandArg("set", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
        { name: "percentage", value: 95 },
        { name: "verdict", value: "Tortolitos" },
      ]),
    ]);

    expect(loveService.setOverride).toHaveBeenCalledWith(
      "111",
      "222",
      95,
      "Tortolitos",
      "owner-1"
    );
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral); // owner default ephemeral
    expect(payload.embeds[0].data.title).toBe("✏️ Override guardado");
  });

  it("becomes public when owner explicitly passes private:false", async () => {
    vi.mocked(loveService.setOverride).mockResolvedValue({
      percentage: 50,
      verdict: null,
      isOverride: true,
    } as any);
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const interaction = createMockInteraction({ user: { id: "owner-1" } });
    await love.run(client, interaction, [
      subCommandArg("set", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
        { name: "percentage", value: 50 },
        { name: "private", value: false },
      ]),
    ]);
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBeUndefined();
  });

  it("rejects out-of-range percentages with an ephemeral notice", async () => {
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const interaction = createMockInteraction({ user: { id: "owner-1" } });
    await love.run(client, interaction, [
      subCommandArg("set", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
        { name: "percentage", value: 200 },
      ]),
    ]);
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("entre 0 y 100");
    expect(loveService.setOverride).not.toHaveBeenCalled();
  });
});

describe("/love reset (owner-only)", () => {
  it("rejects non-owner with an ephemeral notice", async () => {
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const interaction = createMockInteraction({ user: { id: "intruder" } });
    await love.run(client, interaction, [
      subCommandArg("reset", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
      ]),
    ]);
    expect(loveService.resetPair).not.toHaveBeenCalled();
  });

  it("calls the service for owner and replies ephemeral by default", async () => {
    vi.mocked(loveService.resetPair).mockResolvedValue({
      ok: true,
      statusCode: 200,
      message: "ok",
    });
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const interaction = createMockInteraction({ user: { id: "owner-1" } });
    await love.run(client, interaction, [
      subCommandArg("reset", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
      ]),
    ]);

    expect(loveService.resetPair).toHaveBeenCalledWith("111", "222");
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.embeds[0].data.title).toBe("🔄 Pareja reseteada");
  });

  it("returns a friendly notice when the pair didn't exist", async () => {
    vi.mocked(loveService.resetPair).mockResolvedValue({
      ok: false,
      statusCode: 404,
      message: "not found",
    });
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const interaction = createMockInteraction({ user: { id: "owner-1" } });
    await love.run(client, interaction, [
      subCommandArg("reset", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
      ]),
    ]);
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
    expect(payload.content).toContain("no estaba registrada");
  });
});

describe("branding", () => {
  it("ship embed uses fun color and brand footer (no setAuthor)", async () => {
    vi.mocked(loveService.getOrCreatePair).mockResolvedValue({
      percentage: 50,
      verdict: null,
    } as any);
    const interaction = createMockInteraction();
    await love.run(createMockClient(), interaction, [
      subCommandArg("ship", [
        { name: "user1", value: "111" },
        { name: "user2", value: "222" },
      ]),
    ]);
    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.color).toBe(0xfee75c);
    expect(embed.footer.text).toMatch(/Xiza Bot v\d+/);
    expect(embed.author).toBeUndefined();
  });
});

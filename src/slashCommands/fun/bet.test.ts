import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/dao/bet.dao");

import * as betDao from "../../api/dao/bet.dao";
import {
  createMockClient,
  createMockInteraction,
  subCommandArg,
} from "../../test-utils/discord-mocks";
import bet from "./bet";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(betDao.getCoinName).mockResolvedValue("gmicoins");
});

describe("/bet", () => {
  it("create rejects fewer than 2 options", async () => {
    const i = createMockInteraction();
    await bet.run(createMockClient(), i, [
      subCommandArg("create", [
        { name: "title", value: "solo" },
        { name: "options", value: "uno" },
      ]),
    ]);
    expect(i.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
    expect(betDao.createWager).not.toHaveBeenCalled();
  });

  it("create makes a wager with parsed options", async () => {
    vi.mocked(betDao.createWager).mockResolvedValue({} as any);
    const i = createMockInteraction();
    await bet.run(createMockClient(), i, [
      subCommandArg("create", [
        { name: "title", value: "Boca vs River" },
        { name: "options", value: "Boca, River, Empate" },
      ]),
    ]);
    expect(betDao.createWager).toHaveBeenCalledWith(
      "Boca vs River",
      ["Boca", "River", "Empate"],
      "user-1"
    );
  });

  it("balance shows the caller's balance", async () => {
    vi.mocked(betDao.getBalance).mockResolvedValue(1234);
    const i = createMockInteraction();
    await bet.run(createMockClient(), i, [subCommandArg("balance")]);
    const p = i.reply.mock.calls[0][0];
    expect(p.flags).toBe(MessageFlags.Ephemeral);
    expect(p.content).toContain("1234");
  });

  it("place confirms a successful bet", async () => {
    vi.mocked(betDao.getWager).mockResolvedValue({
      status: "open",
      options: ["Boca", "River"],
    } as any);
    vi.mocked(betDao.placeBet).mockResolvedValue({ ok: true, balance: 900 });
    const i = createMockInteraction();
    await bet.run(createMockClient(), i, [
      subCommandArg("place", [
        { name: "wager", value: "wid" },
        { name: "option", value: "Boca" },
        { name: "amount", value: 100 },
      ]),
    ]);
    expect(i.reply.mock.calls[0][0].content).toContain("900");
  });

  it("place rejects an invalid option before touching the wallet", async () => {
    vi.mocked(betDao.getWager).mockResolvedValue({
      status: "open",
      options: ["Boca", "River"],
    } as any);
    const i = createMockInteraction();
    await bet.run(createMockClient(), i, [
      subCommandArg("place", [
        { name: "wager", value: "wid" },
        { name: "option", value: "Nope" },
        { name: "amount", value: 100 },
      ]),
    ]);
    expect(i.reply.mock.calls[0][0].content).toContain("inválida");
    expect(betDao.placeBet).not.toHaveBeenCalled();
  });

  it("resolve is owner-only", async () => {
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const i = createMockInteraction({ user: { id: "intruder" } });
    await bet.run(client, i, [
      subCommandArg("resolve", [
        { name: "wager", value: "wid" },
        { name: "winner", value: "Boca" },
      ]),
    ]);
    expect(i.reply.mock.calls[0][0].content).toContain("owner");
    expect(betDao.resolveWager).not.toHaveBeenCalled();
  });

  it("grant is owner-only", async () => {
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const i = createMockInteraction({ user: { id: "intruder" } });
    await bet.run(client, i, [
      subCommandArg("grant", [
        { name: "user", value: "u1" },
        { name: "amount", value: 500 },
      ]),
    ]);
    expect(i.reply.mock.calls[0][0].content).toContain("owner");
    expect(betDao.grant).not.toHaveBeenCalled();
  });

  it("grant by the owner credits the target", async () => {
    vi.mocked(betDao.grant).mockResolvedValue(1500);
    const client = createMockClient({ config: { ownerId: "owner-1" } });
    const i = createMockInteraction({ user: { id: "owner-1" } });
    await bet.run(client, i, [
      subCommandArg("grant", [
        { name: "user", value: "u1" },
        { name: "amount", value: 500 },
      ]),
    ]);
    expect(betDao.grant).toHaveBeenCalledWith("u1", 500);
    expect(i.reply.mock.calls[0][0].content).toContain("1500");
  });
});

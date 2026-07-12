import { describe, expect, it } from "vitest";

import { setupInMemoryMongo } from "../../test-utils/setup-mongo";
import { Wager, WagerBet, Wallet } from "../models/Bet";
import * as bet from "./bet.dao";

setupInMemoryMongo();

describe("computePayouts (pure parimutuel math)", () => {
  it("winner takes the whole pool proportional to stake", () => {
    const { credits, refunded } = bet.computePayouts(
      [
        { userId: "a", option: "X", amount: 100 },
        { userId: "b", option: "Y", amount: 100 },
      ],
      "X"
    );
    expect(refunded).toBe(false);
    expect(credits).toEqual([{ userId: "a", amount: 200 }]);
  });

  it("splits the pool across multiple winners by stake", () => {
    const { credits } = bet.computePayouts(
      [
        { userId: "a", option: "X", amount: 100 },
        { userId: "b", option: "X", amount: 100 },
        { userId: "c", option: "Y", amount: 200 },
      ],
      "X"
    );
    // total 400, winnerPool 200 → each X-bettor doubles
    expect(credits).toEqual([
      { userId: "a", amount: 200 },
      { userId: "b", amount: 200 },
    ]);
  });

  it("floors payouts (house keeps the dust)", () => {
    const { credits } = bet.computePayouts(
      [
        { userId: "a", option: "X", amount: 100 },
        { userId: "b", option: "Y", amount: 50 },
      ],
      "X"
    );
    // total 150, winnerPool 100 → 100*150/100 = 150
    expect(credits[0].amount).toBe(150);
  });

  it("refunds everyone when nobody backed the winner", () => {
    const { credits, refunded } = bet.computePayouts(
      [{ userId: "a", option: "X", amount: 100 }],
      "Y"
    );
    expect(refunded).toBe(true);
    expect(credits).toEqual([{ userId: "a", amount: 100 }]);
  });
});

describe("bet.dao (in-memory mongo)", () => {
  it("seeds INITIAL_BALANCE on first wallet touch", async () => {
    expect(await bet.getBalance("u1")).toBe(bet.INITIAL_BALANCE);
  });

  it("grant adds coins (and creates the wallet)", async () => {
    const balance = await bet.grant("u2", 500);
    expect(balance).toBe(bet.INITIAL_BALANCE + 500);
  });

  it("placeBet deducts the stake atomically", async () => {
    const w = await bet.createWager("t", ["X", "Y"], "owner");
    const res = await bet.placeBet(
      (w._id as any).toString(),
      "u3",
      "X",
      100
    );
    expect(res).toEqual({ ok: true, balance: bet.INITIAL_BALANCE - 100 });
    expect((await Wallet.findOne({ userId: "u3" }))!.balance).toBe(900);
  });

  it("rejects a bet the user can't afford, leaving the balance untouched", async () => {
    const w = await bet.createWager("t", ["X", "Y"], "owner");
    const res = await bet.placeBet(
      (w._id as any).toString(),
      "u4",
      "X",
      99999
    );
    expect(res).toEqual({ ok: false, reason: "insufficient" });
    expect(await bet.getBalance("u4")).toBe(bet.INITIAL_BALANCE);
  });

  it("rejects a second bet on the same wager and refunds the deduction", async () => {
    const w = await bet.createWager("t", ["X", "Y"], "owner");
    const id = (w._id as any).toString();
    await bet.placeBet(id, "u5", "X", 100);
    const second = await bet.placeBet(id, "u5", "Y", 100);
    expect(second).toEqual({ ok: false, reason: "already-bet" });
    // only one deduction stuck
    expect(await bet.getBalance("u5")).toBe(bet.INITIAL_BALANCE - 100);
    expect(await WagerBet.countDocuments({ wagerId: id, userId: "u5" })).toBe(1);
  });

  it("resolveWager credits winners and marks the wager resolved", async () => {
    const w = await bet.createWager("final", ["X", "Y"], "owner");
    const id = (w._id as any).toString();
    await bet.placeBet(id, "winner", "X", 100);
    await bet.placeBet(id, "loser", "Y", 100);

    const { credits } = await bet.resolveWager(id, "X");
    expect(credits).toEqual([{ userId: "winner", amount: 200 }]);
    // winner: 1000 - 100 + 200 = 1100 ; loser: 1000 - 100 = 900
    expect(await bet.getBalance("winner")).toBe(1100);
    expect(await bet.getBalance("loser")).toBe(900);
    expect((await Wager.findById(id))!.status).toBe("resolved");
  });

  it("getCoinName falls back to gmicoins with no setting", async () => {
    expect(await bet.getCoinName()).toBe("gmicoins");
  });
});

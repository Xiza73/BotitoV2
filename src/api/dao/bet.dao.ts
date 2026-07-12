// ponytail: no ResponseData/service layer here — /bet has no HTTP/API surface,
// it's pure bot-internal logic. DAO returns plain domain values / throws.
import Setting from "../models/Settings";
import { IWagerBet, Wager, WagerBet, Wallet } from "../models/Bet";

export const INITIAL_BALANCE = 1000;
const DEFAULT_COIN_NAME = "gmicoins";

export const getCoinName = async (): Promise<string> => {
  const doc = await Setting.findOne({ key: "coinName" });
  return doc?.value || DEFAULT_COIN_NAME;
};

/** Get-or-create the user's wallet, seeding INITIAL_BALANCE on first touch. */
export const getBalance = async (userId: string): Promise<number> => {
  const w = await Wallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { balance: INITIAL_BALANCE } },
    { new: true, upsert: true }
  );
  return w!.balance;
};

export const grant = async (
  userId: string,
  amount: number
): Promise<number> => {
  await getBalance(userId); // ensure wallet exists
  const w = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { new: true }
  );
  return w!.balance;
};

export const createWager = (
  title: string,
  options: string[],
  createdBy: string
) => Wager.create({ title, options, createdBy });

export const listOpenWagers = () =>
  Wager.find({ status: "open" }).sort({ createdAt: -1 }).limit(25);

export const getWager = (id: string) => Wager.findById(id).catch(() => null);

export const getBets = (wagerId: string) => WagerBet.find({ wagerId });

type PlaceResult =
  | { ok: true; balance: number }
  | { ok: false; reason: "insufficient" | "already-bet" };

/**
 * Deduct the stake and record the bet. One bet per (wager, user) — a second
 * attempt is rejected. Atomic on the balance; a lost double-insert race is
 * refunded.
 * ponytail: check-then-insert has a tiny race; the unique index + refund
 * closes it. Move to a transaction if this ever runs at real scale.
 */
export const placeBet = async (
  wagerId: string,
  userId: string,
  option: string,
  amount: number
): Promise<PlaceResult> => {
  await getBalance(userId); // ensure wallet exists

  const deducted = await Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!deducted) return { ok: false, reason: "insufficient" };

  try {
    await WagerBet.create({ wagerId, userId, option, amount });
  } catch {
    // duplicate (already bet) — refund the deduction
    await Wallet.updateOne({ userId }, { $inc: { balance: amount } });
    return { ok: false, reason: "already-bet" };
  }
  return { ok: true, balance: deducted.balance };
};

export type Credit = { userId: string; amount: number };
export type PayoutResult = { credits: Credit[]; refunded: boolean };

/**
 * Parimutuel payout: winners split the whole pool in proportion to their
 * stake. If nobody backed the winner, everyone is refunded their stake.
 * Payouts floored to whole coins (house keeps the rounding dust).
 */
export const computePayouts = (
  bets: Pick<IWagerBet, "userId" | "option" | "amount">[],
  winnerOption: string
): PayoutResult => {
  const total = bets.reduce((s, b) => s + b.amount, 0);
  const winnerPool = bets
    .filter((b) => b.option === winnerOption)
    .reduce((s, b) => s + b.amount, 0);

  if (winnerPool === 0) {
    return {
      credits: bets.map((b) => ({ userId: b.userId, amount: b.amount })),
      refunded: true,
    };
  }

  const credits = bets
    .filter((b) => b.option === winnerOption)
    .map((b) => ({
      userId: b.userId,
      amount: Math.floor((b.amount * total) / winnerPool),
    }));
  return { credits, refunded: false };
};

export const resolveWager = async (
  wagerId: string,
  winnerOption: string
): Promise<PayoutResult> => {
  const bets = await getBets(wagerId);
  const result = computePayouts(bets, winnerOption);

  await Promise.all(
    result.credits.map((c) =>
      Wallet.updateOne({ userId: c.userId }, { $inc: { balance: c.amount } })
    )
  );
  await Wager.updateOne(
    { _id: wagerId },
    { status: "resolved", winnerOption }
  );
  return result;
};

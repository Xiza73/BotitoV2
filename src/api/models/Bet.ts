import { Document, Schema, model } from "mongoose";

// ── Wager: one betting event with discrete options ──────────────────────────
export interface IWager extends Document {
  title: string;
  options: string[];
  createdBy: string; // discordId
  status: "open" | "resolved";
  winnerOption: string | null;
}

const WagerSchema = new Schema<IWager>(
  {
    title: { type: String, required: true },
    options: { type: [String], required: true },
    createdBy: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    winnerOption: { type: String, default: null },
  },
  { timestamps: true }
);

export const Wager = model<IWager>("Wager", WagerSchema);

// ── WagerBet: one user's stake on one option. One bet per (wager, user). ─────
export interface IWagerBet extends Document {
  wagerId: string;
  userId: string;
  option: string;
  amount: number;
}

const WagerBetSchema = new Schema<IWagerBet>(
  {
    wagerId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    option: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);
WagerBetSchema.index({ wagerId: 1, userId: 1 }, { unique: true });

export const WagerBet = model<IWagerBet>("WagerBet", WagerBetSchema);

// ── Wallet: per-user gmicoin balance ────────────────────────────────────────
export interface IWallet extends Document {
  userId: string;
  balance: number;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Wallet = model<IWallet>("Wallet", WalletSchema);

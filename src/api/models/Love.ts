import { Document, Schema, model } from "mongoose";

export interface ILove extends Document {
  /** Sorted "userIdA-userIdB". Unique key for a pair regardless of arg order. */
  pairKey: string;
  user1: string;
  user2: string;
  /** 0–100 inclusive. Either auto-computed from a deterministic hash or admin-overridden. */
  percentage: number;
  /** Custom verdict text. `null` means use the bucket-based phrase from /love code. */
  verdict: string | null;
  /** True when an admin manually edited percentage/verdict. False = auto-populated. */
  isOverride: boolean;
  /** Discord ID of the admin who set the override. Null when auto-populated. */
  setBy: string | null;
}

const LoveSchema = new Schema<ILove>(
  {
    pairKey: { type: String, required: true, unique: true, index: true },
    user1: { type: String, required: true },
    user2: { type: String, required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    verdict: { type: String, default: null },
    isOverride: { type: Boolean, default: false },
    setBy: { type: String, default: null },
  },
  { timestamps: true }
);

export default model<ILove>("Love", LoveSchema);

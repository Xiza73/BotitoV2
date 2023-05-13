import { model, Schema, Document } from "mongoose";

export interface IGPTAllowedChannel extends Document {
  _id: string;
  channelId: string;
  isActive: boolean;
}

const GPTAllowedChannel = new Schema(
  {
    channelId: {
      type: String,
      unique: true,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model<IGPTAllowedChannel>(
  "GPTAllowedChannel",
  GPTAllowedChannel
);

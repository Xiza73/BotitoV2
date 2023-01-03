import { model, Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  name: string;
  discordId: string;
  telegramId: string;
  birthdayDay: number | null;
  birthdayMonth: number | null;
  month: number | null;
}

const User = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      default: false,
    },
    telegramId: {
      type: String,
      unique: true,
      required: false,
      trim: true,
      default: false,
    },
    discordId: {
      type: String,
      unique: true,
      required: false,
      trim: true,
      default: false,
    },
    birthdayDay: {
      type: Number,
      required: false,
      default: false,
    },
    birthdayMonth: {
      type: Number,
      required: false,
      default: false,
    },
    month: {
      type: Number,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

export default model<IUser>("User", User);

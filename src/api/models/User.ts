import { model, Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  discordId: string;
  birthdayDay: number | null;
  birthdayMonth: number | null;
  month: number | null;
  enableGreetings: boolean;
}

const User = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    discordId: {
      type: String,
      unique: true,
      sparse: true,
      required: false,
      trim: true,
    },
    birthdayDay: {
      type: Number,
      required: false,
    },
    birthdayMonth: {
      type: Number,
      required: false,
    },
    month: {
      type: Number,
      required: false,
    },
    enableGreetings: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model<IUser>("User", User);

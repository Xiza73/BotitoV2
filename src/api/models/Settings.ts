import { Document, Schema, model } from "mongoose";

// Generic key/value settings. Edited directly in the DB (no command).
export interface ISetting extends Document {
  key: string;
  value: string;
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: String, required: true },
});

export default model<ISetting>("Setting", SettingSchema);

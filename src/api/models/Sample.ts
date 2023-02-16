import { model, Schema, Document } from "mongoose";

export interface ISample extends Document {
  _id: string;
  name: string;
  val: string;
}

const Sample = new Schema(
  {
    name: {
      type: String,
      required: true,
      default: false,
    },
    /* val: {
      type: Schema.Types.Mixed,
      default: null,
    } */
    val: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default model<ISample>("Sample", Sample);

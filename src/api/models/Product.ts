import { model, Schema, Document } from "mongoose";

export interface IProduct extends Document {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
}

const Product = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },    
  },
  { timestamps: true }
);

export default model<IProduct>("Product", Product);

import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT ?? 3000,
  token: process.env.token ?? "",
  mongodb: process.env.mongodb ?? " ",
  prefix: process.env.prefix ?? "b!",
  photodb: process.env.photodb ?? "",
  api: process.env.api ?? "http://localhost:3000",
};

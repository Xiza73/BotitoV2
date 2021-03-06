import mongoose, { ConnectOptions } from "mongoose";
import config from "./config";

const dbOptions: ConnectOptions = {
  bufferCommands: true,
  autoIndex: true,
  autoCreate: true,
};

mongoose.connect(config.mongodb, dbOptions).then(
  () => {
    console.log("Conectado a la base de datos");
  },
  (_) => {
    console.log("Error al conectar con la base de datos");
  }
);

export default mongoose;

import mongoose, { ConnectOptions } from "mongoose";
import config from "./config";
import { logger } from "./shared/utils/helpers";

const dbOptions: ConnectOptions = {
  bufferCommands: true,
  autoIndex: true,
  autoCreate: true,
};

mongoose.set("strictQuery", false);
mongoose.connect(config.mongodb, dbOptions).then(
  () => {
    logger("Conectado a la base de datos");
  },
  (_) => {
    logger("Error al conectar con la base de datos");
  }
);

export default mongoose;

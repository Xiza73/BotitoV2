import mongoose, { ConnectOptions } from "mongoose";
import config from "./config";
import { cleanLegacyUserFields } from "./api/dao/user.dao";
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
    cleanLegacyUserFields().catch((err) =>
      logger("[DB] legacy user cleanup failed", err)
    );
  },
  (_) => {
    logger("Error al conectar con la base de datos");
  }
);

export default mongoose;

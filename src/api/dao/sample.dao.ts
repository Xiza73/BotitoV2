import ErrorHandler from "../../helpers/ErrorHandler";
import ResponseBase from "../../helpers/ResponseBase";
import Sample, { ISample } from "../models/Sample";

export const postSample = async (body: any) => {
  try {
    const { name, val } = body;
    if (!name || !val) return new ErrorHandler(400, "Datos insuficientes");
    const sample: ISample = new Sample({
      name,
      val,
    });
    await sample.save();
    return ResponseBase(200, "Muestra agregada correctamente");
  } catch (err) {
    console.log(err);
    return new ErrorHandler(500, "Error al agregar muestra");
  }
};

export const clearAllSamples = async () => {
  try {
    await Sample.deleteMany({});
    return ResponseBase(200, "Muestras eliminadas correctamente");
  } catch (err) {
    return new ErrorHandler(500, "Error al eliminar muestras");
  }
};

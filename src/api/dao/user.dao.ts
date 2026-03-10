import ErrorHandler from "../../handlers/ErrorHandler";
import ResponseBase from "../../handlers/ResponseBase";
import ResponseData from "../../handlers/ResponseData";
import User, { IUser } from "../models/User";
import { capitalize } from "../../shared/utils/helpers";

export const addUser = async (body: {
  name: string;
  discordId?: string;
  birthdayDay: string;
  birthdayMonth: string;
}) => {
  try {
    const { name, discordId, birthdayDay, birthdayMonth } = body;

    if (!name || !birthdayDay || !birthdayMonth)
      return new ErrorHandler(422, "Datos insuficientes");

    const user: IUser = new User({
      name: capitalize(name),
      birthdayDay: parseInt(birthdayDay),
      birthdayMonth: parseInt(birthdayMonth),
      discordId,
      telegramId: discordId,
    });

    await user.save();

    return ResponseBase(200, "Usuario agregado correctamente");
  } catch (err) {
    return new ErrorHandler(500, "Error al agregar usuario");
  }
};

export const readUsers = async () => {
  try {
    const data = await User.find();

    return ResponseData(200, "Usuarios obtenidos correctamente", data);
  } catch (err) {
    return new ErrorHandler(404, "Error al obtener usuarios");
  }
};

export const readUserByName = async (name: string) => {
  try {
    if (!name) return new ErrorHandler(400, "Error al recibir datos");

    const data = await User.findOne({
      name: { $regex: new RegExp(`^${capitalize(name)}$`, "i") },
    });

    if (!data) return new ErrorHandler(400, "Usuario no encontrado");

    return ResponseData(200, "Usuario obtenido correctamente", data);
  } catch (error) {
    return new ErrorHandler(404, "Error al obtener usuario");
  }
};

export const readUserByDiscordId = async (discordId: string) => {
  try {
    if (!discordId) return new ErrorHandler(400, "Error al recibir datos");

    const data = await User.findOne({ discordId });

    if (!data) return new ErrorHandler(400, "Usuario no encontrado");

    return ResponseData(200, "Usuario obtenido correctamente", data);
  } catch (error) {
    return new ErrorHandler(404, "Error al obtener usuario");
  }
};

export const setDiscordId = async (body: { name: string; id: string }) => {
  try {
    const { name, id } = body;
    if (!id || !name) return new ErrorHandler(422, "Datos insuficientes");

    await User.findOneAndUpdate({ name }, { discordId: id });

    return ResponseBase(200, "ID de Discord actualizado correctamente");
  } catch (error) {
    return new ErrorHandler(400, "Error al actualizar id");
  }
};

export const setBirthday = async (body: {
  name: string;
  day: number;
  month: number;
}) => {
  try {
    const { name, day, month } = body;
    if (!name || !day || !month)
      return new ErrorHandler(422, "Datos insuficientes");

    await User.findOneAndUpdate(
      { name },
      { birthdayDay: day, birthdayMonth: month },
    );

    return ResponseBase(200, "Cumpleaños actualizado correctamente");
  } catch (error) {
    return new ErrorHandler(400, "Error al actualizar cumpleaños");
  }
};

export const deleteUser = async (id: string) => {
  try {
    if (!id) return new ErrorHandler(422, "Datos insuficientes");

    await User.findByIdAndDelete(id);

    return ResponseBase(200, "Usuario eliminado correctamente");
  } catch (error) {
    return new ErrorHandler(400, "Error al eliminar usuario");
  }
};

export const getCurrentMessary = async (discordId: string) => {
  try {
    if (!discordId) return new ErrorHandler(422, "Datos insuficientes");

    const data = await User.findOne({ discordId });

    if (!data) return new ErrorHandler(400, "Usuario no encontrado");

    return ResponseData(200, "Mes actual obtenido correctamente", data.month);
  } catch (error) {
    return new ErrorHandler(400, "Error al obtener mes actual");
  }
};

export const updateMonth = async (discordId: string, month: number) => {
  try {
    if (!discordId || !month)
      return new ErrorHandler(422, "Datos insuficientes");

    await User.findOneAndUpdate({ discordId }, { month });

    return ResponseBase(200, "Mes actualizado correctamente");
  } catch (error) {
    return new ErrorHandler(400, "Error al actualizar mes");
  }
};

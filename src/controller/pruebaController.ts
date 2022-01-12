import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../helpers/ErrorHandler";

export const prueba = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return res.status(200).json({
      name: "prueba",
    });
  } catch (err) {
    next(new ErrorHandler(400, "Error al iniciar sesión"));
    return;
  }
};
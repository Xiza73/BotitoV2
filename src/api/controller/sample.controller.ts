import { NextFunction, Request, Response } from "express";
import * as _dao from "../dao/sample.dao";

export const postSample = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.postSample(req.body);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const clearAllSamples = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.clearAllSamples();
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

import { NextFunction, Request, Response } from "express";
import * as _dao from "../dao/server.dao";

export const toggleGPTAllowedChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.toggleGPTAllowedChannel(req.body);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const isGPTAllowedChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.isGPTAllowedChannel(req.body.channelId);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

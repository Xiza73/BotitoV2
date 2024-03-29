import { NextFunction, Request, Response } from "express";
import * as _dao from "../dao/user.dao";

export const addUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.addUser(req.body);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const readUsers = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.readUsers();
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const readUserByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.readUserByName(req.query.name);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const readUserByDiscordId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.readUserByDiscordId(req.query.discordId);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const setDiscordId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.setDiscordId(req.body);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const setBirthday = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.setBirthday(req.body);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const getCurrentMessary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { discordId } = req.query;
  const response = await _dao.getCurrentMessary(discordId?.toString()!);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const updateMonth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { discordId, month } = req.query;
  const response = await _dao.updateMonth(
    discordId?.toString()!,
    parseInt(month?.toString()!)
  );
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

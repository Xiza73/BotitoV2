import { NextFunction, Request, Response } from "express";
import { Month } from "../../shared/types/types";
import * as _dao from "../dao/birthday.dao";

export const getBirthdays = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.getBirthdays();
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const getBirthdaysByMonth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.getBirthdaysByMonth(
    parseInt(req.query.month! as string) as Month
  );
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const getNextBirthday = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.getNextBirthday();
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

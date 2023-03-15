import { NextFunction, Request, Response } from "express";
import * as _dao from "../dao/product.dao";

export const postProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.postProduct(req.body);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.getAllProducts();
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.getProductById(req.params.id);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const updateProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.updateProductById(req.params.id, req.body);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const deleteProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.deleteProductById(req.params.id);
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

export const clearAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = await _dao.clearAllProducts();
  if (response.statusCode === 200) return res.status(200).json(response);
  next(response);
};

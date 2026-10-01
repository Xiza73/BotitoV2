import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";

import _config from "../../config";

// Fails closed: without API_KEY configured, /api rejects every request.
export const requireApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const expected = Buffer.from(_config.apiKey);
  const given = Buffer.from(req.header("x-api-key") ?? "");

  if (
    expected.length === 0 ||
    given.length !== expected.length ||
    !timingSafeEqual(given, expected)
  ) {
    return res
      .status(401)
      .json({ status: "error", statusCode: 401, message: "Unauthorized" });
  }
  next();
};

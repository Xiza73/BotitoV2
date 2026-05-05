import express, { Application, Response, Request, NextFunction } from "express";
import mongoose from "../database";
import _config from "../config";
import cors from "cors";
import morgan from "morgan";
import _router from "./router";
import ErrorHandler from "../handlers/ErrorHandler";
import { logger } from "../shared/utils/helpers";

const _app: Application = express();

// settings
_app.set("port", _config.port);

// middlewares
_app.use(morgan("dev"));
_app.use(express.urlencoded({ extended: true })); // leer data json
_app.use(express.json());
_app.use(cors());

// routes
_app.use("/api", _router);
_app.use((err: ErrorHandler, req: Request, res: Response, _: NextFunction) => {
  return res.status(err.statusCode || 500).json({
    status: "error",
    statusCode: err.statusCode,
    message: err.message,
  });
});

_app.get("/", (_: Request, res: Response) => {
  const mongoConnected = mongoose.connection.readyState === 1;

  res.status(mongoConnected ? 200 : 503).json({
    status: mongoConnected ? "ok" : "degraded",
    uptime: process.uptime(),
    mongo: mongoConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

_app.listen(_app.get("port"));
logger(`Server ready: http://localhost:${_app.get("port")}`);

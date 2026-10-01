import express, { Application, Response, Request, NextFunction } from "express";
import mongoose from "../database";
import _config from "../config";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import _router from "./router";
import openapi from "./openapi";
import ErrorHandler from "../handlers/ErrorHandler";
import { requireApiKey } from "./middleware/requireApiKey";
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
// Docs are public on purpose: the page holds no data, every "Try it out"
// call still goes through requireApiKey.
_app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, { swaggerOptions: { persistAuthorization: true } })
);
_app.use("/api", requireApiKey, _router);
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

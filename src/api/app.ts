import express, { Application, Response, Request, NextFunction } from "express";
import "../database";
import _config from "../config";
import cors from "cors";
import morgan from "morgan";
import _router from "./router";
import ErrorHandler from "../helpers/ErrorHandler";

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

// _app.use(express.static(path.join(__dirname, "public")));
_app.get("*", (_: Request, res: Response) => {
  // res.sendFile(path.resolve(__dirname, "public/index.html"));
  res.send("Hello World");
});

_app.listen(_app.get("port"));
console.log(`Server ready: http://localhost:${_app.get("port")}`);

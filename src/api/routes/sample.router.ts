import { Router } from "express";
import * as _controller from "../controller/sample.controller";

const _sampleRouter: Router = Router();

// routes
_sampleRouter.post("/", _controller.postSample);
_sampleRouter.delete("/", _controller.clearAllSamples);

export default _sampleRouter;

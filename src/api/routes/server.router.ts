import { Router } from "express";
import * as _controller from "../controller/server.controller";

const _userRouter: Router = Router();

// routes
_userRouter.post(
  "/toggleGPTAllowedChannel",
  _controller.toggleGPTAllowedChannel
);
_userRouter.post("/isGPTAllowedChannel", _controller.isGPTAllowedChannel);
export default _userRouter;

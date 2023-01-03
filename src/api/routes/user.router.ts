import { Router } from "express";
import * as _controller from "../controller/user.controller";

const _userRouter: Router = Router();

// routes
_userRouter.get("/", _controller.readUsers);
_userRouter.post("/", _controller.addUser);
_userRouter.get("/name", _controller.readUserByName);
_userRouter.get("/discordId", _controller.readUserByDiscordId);
_userRouter.post("/discordId", _controller.setDiscordId);
_userRouter.post("/birthday", _controller.setBirthday);
_userRouter.get("/updateMonth", _controller.updateMonth);
_userRouter.get("/getCurrentMessary", _controller.getCurrentMessary);

export default _userRouter;

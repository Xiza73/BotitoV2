import { Router } from "express";
import * as _controller from "../controller/birthday.controller";

const _userRouter: Router = Router();

// routes
_userRouter.get("/", _controller.getBirthdays);
_userRouter.get("/month", _controller.getBirthdaysByMonth);
_userRouter.get("/next", _controller.getNextBirthday);

export default _userRouter;

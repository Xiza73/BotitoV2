import { Router } from "express";
import _userRouter from "./routes/user.router";

const _router: Router = Router();

// routes
_router.use("/user", _userRouter);

export default _router;

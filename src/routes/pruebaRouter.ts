import { Router } from "express";
import * as _controller from "../controller/pruebaController";

const _pruebaRouter: Router = Router();

//routes
_pruebaRouter.get('/', _controller.prueba);

export default _pruebaRouter
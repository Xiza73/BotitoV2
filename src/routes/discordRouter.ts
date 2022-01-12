import { Router } from 'express'
import * as _controller from "../controller/discordController";

const _discordRouter: Router = Router();

//routes
_discordRouter.get('/', _controller.goodMorning);

export default _discordRouter
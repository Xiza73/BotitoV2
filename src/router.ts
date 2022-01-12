import { Router } from 'express'
import _pruebaRouter from './routes/pruebaRouter'
import _userRouter from './routes/user.router';

const _router: Router = Router();

//routes
_router.use('/', _pruebaRouter);
_router.use('/user', _userRouter)

export default _router;
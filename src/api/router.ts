import { Router } from "express";

import routes from "./routes";

const _router: Router = Router();

for (const { path, router } of routes) {
  _router.use(path, router);
}

export default _router;

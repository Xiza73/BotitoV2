import { Router } from "express";
import _userRouter from "./routes/user.router";
import _birthdayRouter from "./routes/birthday.router";
import { readdirSync } from "fs";
import path from "path";

const _router: Router = Router();

(async () => {
  const routes = readdirSync(path.resolve(__dirname, "./routes"));
  for (const route of routes) {
    const routeFile = await import(`./routes/${route}`);
    const routePath = `/${route.split(".")[0]}`;
    console.log(routePath);
    _router.use(routePath, routeFile.default);
  }
})();

export default _router;

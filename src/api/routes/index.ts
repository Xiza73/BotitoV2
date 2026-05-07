// Manifest estático de routes de Express.
//
// Este array es la única fuente de verdad para qué rutas monta el router de
// `/api`. Si agregás una route nueva:
//   1. Crearla en `src/api/routes/<recurso>.router.ts` con `export default Router`
//   2. Importarla arriba y agregar la entrada con `path` y `router`
//
// No usamos `readdirSync` + `import()` dinámico — ver
// `src/slashCommands/index.ts` para el por qué.
// Bonus: el loader anterior corría en una IIFE async, lo que generaba una
// race condition contra `app.listen`. Con imports estáticos las rutas se
// montan sincrónicamente antes de que arranque el server.

import { Router } from "express";

import birthdayRouter from "./birthday.router";
import userRouter from "./user.router";

export interface RouteEntry {
  path: string;
  router: Router;
}

const routes: RouteEntry[] = [
  { path: "/birthday", router: birthdayRouter },
  { path: "/user", router: userRouter },
];

export default routes;

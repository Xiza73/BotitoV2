// Manifest estático de slash commands.
//
// Este array es la única fuente de verdad para qué slash commands carga el
// bot. Si agregás un comando nuevo:
//   1. Crealo en `src/slashCommands/<categoria>/<nombre>.ts` con `export default`
//   2. Importalo arriba y agregalo al array en su sección de categoría
//
// No usamos `readdirSync` + `import()` dinámico porque los watchers
// (tsx watch, node --watch, esbuild, etc.) no pueden inferir paths con
// strings interpolados, y eso rompe el reload en dev.

import { ISlashCommand } from "../shared/types";

import ahorcado from "./fun/ahorcado";
import flip from "./fun/flip";
import imc from "./fun/imc";
import love from "./fun/love";
import poke from "./fun/poke";
import roll from "./fun/roll";
import ruleta from "./fun/ruleta";
import shuffle from "./fun/shuffle";

import channelId from "./info/channel-id";
import gmi2 from "./info/gmi2";
import help from "./info/help";
import ping from "./info/ping";

import clear from "./mod/clear";
import cums from "./mod/cums";
import nextcum from "./mod/nextcum";
import register from "./mod/register";
import say from "./mod/say";
import who from "./mod/who";

const slashCommands: ISlashCommand[] = [
  // fun
  ahorcado,
  flip,
  imc,
  love,
  poke,
  roll,
  ruleta,
  shuffle,
  // info
  channelId,
  gmi2,
  help,
  ping,
  // mod
  clear,
  cums,
  nextcum,
  register,
  say,
  who,
];

export default slashCommands;

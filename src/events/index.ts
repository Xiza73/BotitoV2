// Manifest estático de event handlers de Discord.
//
// Este array es la única fuente de verdad para qué events registra el bot.
// Si agregás un event nuevo:
//   1. Crealo en `src/events/<categoria>/<nombre>.ts` con `export default`
//   2. Importalo arriba y agregalo al array
//
// No usamos `readdirSync` + `import()` dinámico — ver
// `src/slashCommands/index.ts` para el por qué.

import { IBotEvent } from "../shared/types";

import interactionCreate from "./client/interactionCreate";
import ready from "./client/ready";

import messageDelete from "./message/messageDelete";
import messageUpdate from "./message/messageUpdate";

const events: IBotEvent[] = [
  // client
  interactionCreate,
  ready,
  // message
  messageDelete,
  messageUpdate,
];

export default events;

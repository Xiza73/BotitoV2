/**
 * Hardcoded changelog source for the /changelog slash command.
 *
 * Curatorial — not a literal mapping of git history. Bump a new entry at
 * the top of the array when a release ships something the server cares
 * about. Older entries can stay or get trimmed; the command shows them
 * newest-first.
 */

export type ChangelogEntry = {
  version: string;
  date: string; // ISO YYYY-MM-DD
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.4.0",
    date: "2026-05-08",
    highlights: [
      "Facelift completo de los 18 slash commands con branding consistente (info azul, fun amarillo, mod rojo).",
      "/help con autocomplete, dropdown y botón ‘volver al listado’.",
      "/love con persistencia en Mongo y subcomandos owner para curar overrides.",
      "/clear ahora DMea al moderador un recap con texto y archivos de lo eliminado.",
      "Nuevos comandos: /about, /changelog, /uptime, /feedback, /team, /cum.",
    ],
  },
  {
    version: "0.3.2",
    date: "2026-05-06",
    highlights: [
      "Migración completa a discord.js v14, Node 22, Mongoose 8, pnpm 10.",
      "Loaders estáticos en lugar de readdir dinámico (compatible con tsx watch).",
      "143 tests cubriendo el bot end-to-end, CI con GitHub Actions.",
      "Strings del bot pasados a español neutral (tuteo).",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-04-22",
    highlights: [
      "Refactor del code base: dead code purge, DAO directo, separación de responsabilidades.",
      "Tests co-locados al lado del código (*.test.ts).",
    ],
  },
];

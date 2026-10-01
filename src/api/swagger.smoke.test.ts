import express from "express";
import swaggerUi from "swagger-ui-express";
import { expect, it, vi } from "vitest";

vi.mock("../config", () => ({ default: { apiKey: "secret" } }));

import openapi from "./openapi";
import { requireApiKey } from "./middleware/requireApiKey";

it("serves /api-docs publicly while /api stays behind the key", async () => {
  const app = express();
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi));
  app.use("/api", requireApiKey, (_req, res) => res.json({ ok: true }));
  const server = app.listen(0);
  const base = `http://localhost:${(server.address() as any).port}`;

  const docs = await fetch(`${base}/api-docs/`);
  const noKey = await fetch(`${base}/api/user`);
  const withKey = await fetch(`${base}/api/user`, { headers: { "x-api-key": "secret" } });
  server.close();

  expect(docs.status).toBe(200);
  expect(await docs.text()).toContain("swagger-ui");
  expect(noKey.status).toBe(401);
  expect(withKey.status).toBe(200);
});

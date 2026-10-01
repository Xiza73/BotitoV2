import { describe, expect, it, vi } from "vitest";

vi.mock("../../config", () => ({ default: { apiKey: "secret" } }));

import _config from "../../config";
import { requireApiKey } from "./requireApiKey";

const run = (key?: string) => {
  const res: any = { status: vi.fn(() => res), json: vi.fn(() => res) };
  const next = vi.fn();
  requireApiKey({ header: () => key } as any, res, next);
  return { res, next };
};

describe("requireApiKey", () => {
  it("passes with the right key and rejects wrong or missing ones", () => {
    expect(run("secret").next).toHaveBeenCalled();
    expect(run("wrong!").res.status).toHaveBeenCalledWith(401);
    expect(run().res.status).toHaveBeenCalledWith(401);
  });

  it("fails closed when API_KEY is not configured", () => {
    (_config as any).apiKey = "";
    expect(run("").res.status).toHaveBeenCalledWith(401);
  });
});

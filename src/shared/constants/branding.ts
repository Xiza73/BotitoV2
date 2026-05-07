import { readFileSync } from "fs";
import { resolve } from "path";

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../../../package.json"), "utf-8")
) as { version: string };

export const BOT_BRAND_NAME = "Xiza Bot";
export const BOT_VERSION = `v${packageJson.version}`;

export type CategoryName = "fun" | "info" | "mod";

const CATEGORY_COLOR: Record<CategoryName, number> = {
  info: 0x5865f2, // Discord blurple
  fun: 0xfee75c, // Discord yellow
  mod: 0xed4245, // Discord red
};

const CATEGORY_EMOJI: Record<CategoryName, string> = {
  info: "ℹ️",
  fun: "🎉",
  mod: "🛡️",
};

export const DEFAULT_BRAND_COLOR = CATEGORY_COLOR.info;

const isCategoryName = (s: string | null | undefined): s is CategoryName =>
  s === "fun" || s === "info" || s === "mod";

export const colorForCategory = (cat: string | null | undefined): number =>
  isCategoryName(cat) ? CATEGORY_COLOR[cat] : DEFAULT_BRAND_COLOR;

export const emojiForCategory = (cat: string | null | undefined): string =>
  isCategoryName(cat) ? CATEGORY_EMOJI[cat] : "";

export const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);

#!/usr/bin/env node
/**
 * Verifies every model ID in src/lib/openrouter.ts is still served by OpenRouter.
 *
 * Usage:
 *   npm run check:models
 *
 * No API key needed (uses the public model list). Exits 1 if any ID is gone.
 */

import { readFileSync } from "fs";

const source = readFileSync(new URL("../src/lib/openrouter.ts", import.meta.url), "utf8");
const block = source.match(/export const models = \{([\s\S]*?)\} as const/);
if (!block) {
  console.error("Could not find `models` in src/lib/openrouter.ts");
  process.exit(1);
}
const configured = [...block[1].matchAll(/^\s*(\w+):\s*"([^"]+)"/gm)].map(([, key, id]) => ({ key, id }));

const res = await fetch("https://openrouter.ai/api/v1/models");
if (!res.ok) {
  console.error(`OpenRouter model list request failed: ${res.status}`);
  process.exit(1);
}
const live = new Map((await res.json()).data.map((m) => [m.id, m]));

let missing = 0;
for (const { key, id } of configured) {
  const model = live.get(id);
  if (!model) {
    missing++;
    console.error(`MISSING  ${key}: ${id}`);
  } else {
    const expires = model.expiration_date ? `  (expires ${model.expiration_date})` : "";
    console.log(`ok       ${key}: ${id}${expires}`);
  }
}
process.exit(missing ? 1 : 0);

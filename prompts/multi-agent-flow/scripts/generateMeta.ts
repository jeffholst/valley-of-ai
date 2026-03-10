// scripts/generateMeta.ts
import fs from "node:fs"
import path from "node:path"
import { assertValidMeta } from "./validateMeta.js"

function writeMeta(appDir: string, meta: any) {
  const appId = meta.id
  const runId = meta.generation?.runId ?? "unknown-run"

  // Validate before writing
  assertValidMeta(meta, appId, runId)

  const metaPath = path.join(appDir, "meta.json")
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8")
}

export { writeMeta }

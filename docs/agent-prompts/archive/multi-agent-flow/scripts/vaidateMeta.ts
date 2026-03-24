// scripts/validateMeta.ts
import Ajv from "ajv"
import metaSchema from "../schemas/meta.json" assert { type: "json" }

const ajv = new Ajv({ allErrors: true })
const validateMeta = ajv.compile(metaSchema)

export function assertValidMeta(meta: unknown, appId: string, runId: string) {
  const valid = validateMeta(meta)
  if (!valid) {
    const errors = validateMeta.errors || []
    const message =
      `Invalid meta.json for ${appId} (runId=${runId}): ` +
      errors
        .map(e => `${e.instancePath || "<root>"} ${e.message}`)
        .join("; ")
    throw new Error(message)
  }
}

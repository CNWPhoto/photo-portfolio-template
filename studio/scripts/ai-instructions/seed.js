// Seed AI Assist instruction docs into a Sanity dataset.
//
// Usage:
//   SANITY_PROJECT_ID=<id> npx sanity exec scripts/ai-instructions/seed.js \
//     --with-user-token
//
// Or via the npm wrapper:
//   npm run seed:ai-instructions
//
// The script reads from ./starter-prompts.js, transforms each document-type
// entry into a `sanity.assist.schemaType.annotations` doc keyed by the doc
// type, and creates-or-replaces. Annotation docs already in the dataset
// keep any field-path entries the seed config doesn't manage.
//
// Idempotent. Re-running pushes any prompt edits over previously-seeded
// values at the same path. Editor customizations on un-managed paths
// survive.

import {randomUUID} from 'node:crypto'
import {getCliClient} from 'sanity/cli'
import {annotations as annotationsConfig} from './starter-prompts.js'

const client = getCliClient({apiVersion: '2024-01-01'})

const ASSIST_DOC_PREFIX = 'sanity.assist.schemaType.'
const ASSIST_DOC_TYPE = 'sanity.assist.schemaType.annotations'
const ASSIST_FIELD_TYPE = 'sanity.assist.schemaType.field'
const INSTRUCTION_TYPE = 'sanity.assist.instruction'

// "system" sentinel for createdById on machine-seeded instructions. The
// plugin's UI flow sets this to the editor's user ID; for seeds we don't
// have a user. Empty string would be valid too. The value isn't enforced;
// it's metadata for "who created this instruction."
const SEED_AUTHOR = 'system'

const shortKey = () => randomUUID().replace(/-/g, '').slice(0, 12)

// Convert a multi-paragraph string (\n\n separated) into Portable Text
// blocks. Mirrors how the Studio UI stores prompts authored by hand.
function promptStringToBlocks(text) {
  return text.split(/\n\n+/).map((para) => ({
    _key: shortKey(),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _key: shortKey(),
        _type: 'span',
        text: para.trim(),
        marks: [],
      },
    ],
  }))
}

// Build a single instruction object. userId is OMITTED (not set to "")
// because that's how the plugin stores "shared with all studio members"
// — empty string would be interpreted as a private-to-someone visibility
// scope and the instruction wouldn't appear for other editors.
function buildInstruction(instr) {
  return {
    _key: shortKey(),
    _type: INSTRUCTION_TYPE,
    title: instr.title,
    createdById: SEED_AUTHOR,
    prompt: promptStringToBlocks(instr.prompt),
  }
}

// Build the annotation doc for a single document type. Field _key uses
// the path itself — the plugin uses path-as-key for dedup so re-running
// the seed cleanly replaces matching entries.
function buildAnnotationDoc(typeConfig) {
  return {
    _id: `${ASSIST_DOC_PREFIX}${typeConfig.documentType}`,
    _type: ASSIST_DOC_TYPE,
    title: typeConfig.title,
    fields: typeConfig.fields.map((field) => ({
      _key: field.path,
      _type: ASSIST_FIELD_TYPE,
      path: field.path,
      instructions: field.instructions.map(buildInstruction),
    })),
  }
}

// Merge: preserve existing fields whose path isn't managed by this seed.
// For paths we DO manage, our values win (so prompt edits propagate on
// re-seed). Editors who add per-field prompts via Studio UI for unmanaged
// paths keep their work.
function mergeFields(existingDoc, seedDoc) {
  if (!existingDoc) return seedDoc
  const seedPaths = new Set(seedDoc.fields.map((f) => f.path))
  const preserved = (existingDoc.fields || []).filter((f) => !seedPaths.has(f.path))
  return {
    ...seedDoc,
    fields: [...seedDoc.fields, ...preserved],
  }
}

async function run() {
  const projectId = client.config().projectId
  const dataset = client.config().dataset
  console.log(`\nSeeding AI Assist instructions → projectId=${projectId} dataset=${dataset}`)

  const transaction = client.transaction()
  let writeCount = 0

  for (const typeConfig of annotationsConfig) {
    const docId = `${ASSIST_DOC_PREFIX}${typeConfig.documentType}`
    const seedDoc = buildAnnotationDoc(typeConfig)

    const existing = await client.getDocument(docId).catch(() => null)
    const finalDoc = mergeFields(existing, seedDoc)

    transaction.createOrReplace(finalDoc)
    writeCount += 1
    const fieldList = typeConfig.fields.map((f) => f.path).join(', ')
    console.log(`  • ${typeConfig.documentType} (${typeConfig.title})`)
    console.log(`      paths: ${fieldList}`)
  }

  console.log(`\nCommitting ${writeCount} annotation document(s)...`)
  await transaction.commit()
  console.log('✓ Done.\n')
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

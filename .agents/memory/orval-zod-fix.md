---
name: Orval Zod looseObject Fix
description: Blueprint object fields must be type string to avoid zod.looseObject() in Zod 3.25.x
---

## The Problem
Orval 8.22 generates `zod.looseObject(...)` for OpenAPI fields typed as `type: ["object", "null"]`.
Zod 3.25.x does not have `.looseObject()` — this causes a typecheck failure.

## The Fix
Change bare `type: ["object", "null"]` (or `type: object`) fields that hold arbitrary JSON to `type: ["string", "null"]` in the OpenAPI spec.
Store JSON as serialized strings in the database (TEXT columns) and parse/stringify on the server side.

**Why:** The Orval+Zod version pairing does not support loose/unknown object schemas gracefully.
**How to apply:** Any future "store arbitrary JSON" field should use `type: string` in openapi.yaml and a TEXT column in Drizzle. Document the field as "(JSON string)" in its description.

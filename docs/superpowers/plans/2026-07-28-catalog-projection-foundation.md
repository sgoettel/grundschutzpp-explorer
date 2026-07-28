# Catalog Projection Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the unchanged OSCAL catalog as source data while projecting Control- and Part-level properties with their namespace, origin level, raw object, and logical source path.

**Architecture:** The existing permissive OSCAL source types remain deliberately partial and retain unknown fields through index signatures. `parseCatalog()` continues to flatten controls for existing consumers, but each `ControlRecord` gains a separate metadata projection derived without mutating the source objects.

**Tech Stack:** TypeScript 5.6, Vitest 2, existing React/Vite application

## Global Constraints

- Implement only this small parser/data-model milestone; do not change UI, search, cache, or exports.
- Preserve the unchanged loaded catalog and raw Control, Part, and Prop objects.
- Model only structures needed by the Explorer; do not build a general OSCAL suite.
- Keep `control.class` separate from the `sec_level` property.
- Preserve Control-/Part-level origin, namespace, and logical source path.
- Classify unknown properties into a visible-ready fallback projection without dropping them.
- Do not commit, push, merge, create a pull request, or change a branch.

---

### Task 1: Specify the lossless metadata projection with a synthetic fixture

**Files:**
- Create: `src/__fixtures__/catalog-projection.json`
- Modify: `src/lib/catalog.test.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/catalog.ts`

**Interfaces:**
- Consumes: `parseCatalog(input: unknown): CatalogParsingResult`
- Produces: `CatalogParsingResult.source`, `ControlRecord.metadata`, recursive `CatalogPart.parts`, and raw-object references

- [x] **Step 1: Add the synthetic projection fixture**

Create one Practice → Topic → Control hierarchy containing:

- `control.class = "normal-SdT"`
- a known Control prop `sec_level`
- an unknown Control prop with a namespace
- a statement Part with the known prop `modal_verb`
- a nested Part with an unknown prop
- remarks and extra unknown fields on source objects

- [x] **Step 2: Write the failing projection test**

The test must assert literal outcomes:

```ts
expect(result.source).toBe(projectionFixture);
expect(record?.control).toBe(projectionFixture.catalog.groups[0].groups[0].controls[0]);
expect(record?.metadata.known.map((prop) => prop.name)).toEqual([
  'sec_level',
  'modal_verb'
]);
expect(record?.metadata.unknown.map((prop) => prop.name)).toEqual([
  'future_control_prop',
  'future_part_prop'
]);
expect(record?.metadata.known[0]).toMatchObject({
  namespace: 'https://bsi.bund.de/ns/grundschutz-plusplus',
  sourceLevel: 'control',
  sourcePath: 'Control → Prop'
});
expect(record?.metadata.known[1]).toMatchObject({
  sourceLevel: 'part',
  sourcePath: 'Control → statement-Part → Prop'
});
expect(record?.metadata.unknown[1]).toMatchObject({
  sourceLevel: 'part',
  sourcePath: 'Control → statement-Part → item-Part → Prop'
});
expect(record?.control.class).toBe('normal-SdT');
```

The production mutations caught by this test are: copying instead of preserving the source, skipping Part props, flattening away origin data, losing namespaces, treating `control.class` as `sec_level`, and dropping unknown props.

- [x] **Step 3: Run the focused test and verify RED**

Run:

```bash
npx vitest run src/lib/catalog.test.ts
```

Expected: failure because `CatalogParsingResult.source` and `ControlRecord.metadata` do not exist.

- [x] **Step 4: Add the minimum source and projection types**

Add focused types:

```ts
export interface CatalogProp {
  name?: string;
  value?: string;
  ns?: string;
  [key: string]: unknown;
}

export interface CatalogPart {
  id?: string;
  name?: string;
  title?: string;
  prose?: string;
  props?: CatalogProp[];
  parts?: CatalogPart[];
  remarks?: string;
  [key: string]: unknown;
}

export interface ProjectedProp {
  name?: string;
  value?: string;
  namespace?: string;
  sourceLevel: 'control' | 'part';
  sourcePath: string;
  raw: CatalogProp;
}

export interface ControlMetadataProjection {
  known: ProjectedProp[];
  unknown: ProjectedProp[];
}
```

Extend the existing parser result and control record without removing their current fields.

- [x] **Step 5: Implement recursive property projection**

Use a small explicit set of Explorer-known property names. Project Control props first, then recursively visit every Part and nested Part. Build logical paths from stable Part labels (`name`, then `title`, then `id`, then `Part`) and retain each original Prop object in `raw`.

Return the original validated catalog root as `CatalogParsingResult.source`; return `null` for invalid input. Do not mutate or clone the source document.

- [x] **Step 6: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run src/lib/catalog.test.ts
```

Expected: all catalog parser tests pass.

- [x] **Step 7: Run full milestone verification**

Run:

```bash
npm run lint
npx vitest run
npm run build
```

Expected: all commands exit with code 0, with 0 lint errors, all tests passing, and a successful Vite production build.

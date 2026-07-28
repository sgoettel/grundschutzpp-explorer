# Parameter Resolution Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve OSCAL parameter inserts into readable text segments while retaining the original insert, parameter ID, label, values, and raw source object.

**Architecture:** A new pure `parameters.ts` module owns parsing and resolution, independent of React. It returns text and parameter segments plus a plain-text representation so later UI, preview, search, and export milestones can consume the same lossless result.

**Tech Stack:** TypeScript 5.6, Vitest 2, existing React/Vite application

## Global Constraints

- Implement only the parameter-resolution projection; do not change UI behavior in this milestone.
- Prefer the first non-empty OSCAL `values` entry for readable insertion, then the label, then `[parameter-id]`.
- Preserve the exact original insert instruction and the raw parameter object.
- Preserve all parameter values without building a general OSCAL model.
- Missing parameter references must remain readable and traceable rather than disappearing.
- Do not commit, push, merge, create a pull request, or change a branch.

---

### Task 1: Resolve parameter inserts without losing source details

**Files:**
- Create: `src/lib/parameters.ts`
- Create: `src/lib/parameters.test.ts`

**Interfaces:**
- Consumes: `resolveParameterInserts(prose: unknown, params?: CatalogParam[]): ResolvedProse`
- Produces: `ResolvedProseSegment[]` and a `plainText` string

- [x] **Step 1: Write failing tests**

Test a known parameter with label and multiple values:

```ts
const parameter: CatalogParam = {
  id: 'p-frist',
  label: 'festgelegte Frist',
  values: ['30 Tage', '60 Tage']
};
const result = resolveParameterInserts(
  'Die Frist beträgt {{ insert: param, p-frist }}.',
  [parameter]
);

expect(result.plainText).toBe('Die Frist beträgt 30 Tage.');
expect(result.segments[1]).toMatchObject({
  kind: 'parameter',
  text: '30 Tage',
  original: '{{ insert: param, p-frist }}',
  parameterId: 'p-frist',
  label: 'festgelegte Frist',
  values: ['30 Tage', '60 Tage'],
  resolved: true
});
expect(result.segments[1].raw).toBe(parameter);
```

Test an unknown parameter reference:

```ts
const result = resolveParameterInserts(
  'Wert: {{ insert: param, p-missing }}',
  []
);

expect(result.plainText).toBe('Wert: [p-missing]');
expect(result.segments[1]).toMatchObject({
  kind: 'parameter',
  text: '[p-missing]',
  original: '{{ insert: param, p-missing }}',
  parameterId: 'p-missing',
  values: [],
  resolved: false
});
```

These tests catch value/label priority reversal, loss of Values, loss of the exact source instruction, failure to retain the raw parameter, and silent removal of missing references.

- [x] **Step 2: Run focused tests and verify RED**

Run:

```bash
npx vitest run src/lib/parameters.test.ts
```

Expected: failure because `./parameters` does not exist.

- [x] **Step 3: Implement the minimal pure resolver**

Define:

```ts
export interface ResolvedTextSegment {
  kind: 'text';
  text: string;
}

export interface ResolvedParameterSegment {
  kind: 'parameter';
  text: string;
  original: string;
  parameterId: string;
  label?: string;
  values: string[];
  resolved: boolean;
  raw?: CatalogParam;
}

export interface ResolvedProse {
  plainText: string;
  segments: Array<ResolvedTextSegment | ResolvedParameterSegment>;
}
```

Parse every `{{ insert: param, id }}` occurrence in source order. Emit surrounding text as text segments and each occurrence as its own parameter segment. Do not mutate the input parameter or its Values array.

- [x] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
npx vitest run src/lib/parameters.test.ts
```

Expected: both parameter tests pass.

- [x] **Step 5: Run full milestone verification**

Run:

```bash
npm run lint
npx vitest run
npm run build
```

Expected: all commands exit with code 0.

# Control Detail Projection UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render resolved OSCAL parameters and projected known and unknown metadata in the control detail view without losing their source details.

**Architecture:** Two focused presentational components consume the existing pure projections. `ResolvedProse` renders `resolveParameterInserts()` segments, while `ControlMetadata` renders `ControlRecord.metadata` and keeps `control.class` separate; `ControlDetail` only arranges the resulting sections.

**Tech Stack:** TypeScript 5.6, React 18, Testing Library 16, Vitest 2, existing Vite application

## Global Constraints

- Implement exactly two sequential milestones: parameter UI, then metadata UI.
- Do not change search, cache, exports, navigation, or OSCAL source types.
- Preserve all existing uncommitted user changes.
- Do not build a general OSCAL suite.
- Do not commit, push, merge, create a pull request, or change a branch.
- Run focused tests in RED and GREEN states, then run full tests, lint, and build.

---

### Task 1: Render resolved parameter segments in the detail view

**Files:**
- Create: `src/components/ControlDetail.test.tsx`
- Create: `src/components/ResolvedProse.tsx`
- Modify: `src/components/ControlDetail.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `resolveParameterInserts(prose: unknown, params?: CatalogParam[]): ResolvedProse`
- Produces: `ResolvedProse({ prose, params }): ReactElement | null`

- [x] **Step 1: Write the failing integration test**

Render `ControlDetail` with a statement containing one parameter whose first
Value differs from its label:

```tsx
const record: ControlRecord = {
  id: 'APP.1',
  title: 'Fristen festlegen',
  groupPath: ['Organisation', 'Regelungen'],
  fullText: '',
  control: {
    params: [{
      id: 'p-frist',
      label: 'festgelegte Frist',
      values: ['30 Tage', '60 Tage']
    }],
    parts: [{
      name: 'statement',
      prose: 'Die Frist beträgt {{ insert: param, p-frist }}.'
    }]
  },
  metadata: { known: [], unknown: [] }
};

render(<ControlDetail control={record} />);

expect(screen.getByText('30 Tage')).toHaveClass('parameter-value');
expect(screen.getByText('{{ insert: param, p-frist }}')).toBeInTheDocument();
expect(screen.getByText('p-frist')).toBeInTheDocument();
expect(screen.getByText('festgelegte Frist')).toBeInTheDocument();
expect(screen.getByText('60 Tage')).toBeInTheDocument();
expect(screen.queryByRole('heading', { name: 'Konkretisierungen' }))
  .not.toBeInTheDocument();
```

The existing UI must fail because it inserts the label, has no inline marker,
does not expose the original insert or Values, and renders a separate
Konkretisierungen section.

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run src/components/ControlDetail.test.tsx
```

Expected: FAIL because `30 Tage` and the required source details are absent.

- [x] **Step 3: Implement `ResolvedProse`**

Call the pure resolver once. Render text segments unchanged. For every
parameter segment render:

```tsx
<mark className="parameter-value">{segment.text}</mark>
<details className="parameter-details">
  <summary>Parameterdetails</summary>
  <dl>
    <dt>Ursprüngliche OSCAL-Anweisung</dt>
    <dd><code>{segment.original}</code></dd>
    <dt>Parameter-ID</dt>
    <dd><code>{segment.parameterId}</code></dd>
    <dt>Label</dt>
    <dd>{segment.label ?? '–'}</dd>
    <dt>Values</dt>
    <dd>
      {segment.values.length
        ? <ul>{segment.values.map((value, index) =>
            <li key={`${segment.parameterId}-${index}`}>{value}</li>)}</ul>
        : '–'}
    </dd>
  </dl>
</details>
```

Return `null` for an empty result. Add small CSS rules that keep the parameter
mark and native details visually distinct, keyboard accessible, and usable
without hover.

- [x] **Step 4: Integrate the component and remove duplicate logic**

Use `ResolvedProse` for statement, guidance, and the existing direct
`otherParts` prose. Remove `INSERT_PARAM_RX`, `buildParamLabelMap`,
`resolveParamInserts`, `renderParams`, `usedParamIds`, and the
Konkretisierungen section from `ControlDetail`.

- [x] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run src/components/ControlDetail.test.tsx
```

Expected: the parameter integration test passes without console warnings.

---

### Task 2: Render projected metadata with a visible unknown fallback

**Files:**
- Modify: `src/components/ControlDetail.test.tsx`
- Create: `src/components/ControlMetadata.tsx`
- Modify: `src/components/ControlDetail.tsx`
- Modify: `src/index.css`
- Modify: `tsconfig.json`

**Interfaces:**
- Consumes: `ControlRecord.metadata: ControlMetadataProjection` and `ControlRecord.control.class`
- Produces: `ControlMetadata({ record }): ReactElement | null`

- [x] **Step 1: Write the failing metadata integration test**

Render `ControlDetail` with:

```tsx
const record: ControlRecord = {
  id: 'APP.2',
  title: 'Metadaten prüfen',
  groupPath: ['Organisation', 'Regelungen'],
  fullText: '',
  control: { class: 'normal-SdT' },
  metadata: {
    known: [
      {
        name: 'sec_level',
        value: 'Basis',
        namespace: 'https://bsi.bund.de/ns/grundschutz-plusplus',
        sourceLevel: 'control',
        sourcePath: 'Control → Prop',
        raw: { name: 'sec_level', value: 'Basis' }
      },
      {
        name: 'modal_verb',
        value: 'MUSS',
        sourceLevel: 'part',
        sourcePath: 'Control → statement-Part → Prop',
        raw: { name: 'modal_verb', value: 'MUSS' }
      }
    ],
    unknown: [{
      name: 'future_part_prop',
      value: 'zukünftiger Wert',
      namespace: 'https://example.test/future',
      sourceLevel: 'part',
      sourcePath: 'Control → statement-Part → item-Part → Prop',
      raw: { name: 'future_part_prop', value: 'zukünftiger Wert' }
    }]
  }
};
```

Assert that the rendered view contains:

- `Sicherheitsniveau` with `Basis`,
- `Technische Klassifikation` with `normal-SdT`,
- `Modalverb` with `MUSS`,
- the exact fallback heading,
- `future_part_prop`, its value, namespace, `Part` origin, and source path.

Also assert that no badge or label calls `normal-SdT` a `Niveau`.

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run src/components/ControlDetail.test.tsx
```

Expected: the new metadata test fails because the current UI ignores
`ControlRecord.metadata`, omits Part props and the fallback, and hides
`normal-SdT`.

- [x] **Step 3: Implement `ControlMetadata`**

Use an explicit label map:

```ts
const KNOWN_PROP_LABELS: Record<string, string> = {
  sec_level: 'Sicherheitsniveau',
  modal_verb: 'Modalverb',
  action_word: 'Handlungswort',
  result: 'Ergebnis',
  result_specification: 'Ergebnisspezifikation',
  documentation: 'Dokumentation',
  'alt-identifier': 'Technische Kennung',
  effort_level: 'Aufwandsstufe',
  tags: 'Tags'
};
```

Render `control.class` separately as `Technische Klassifikation`. Render every
known projected Prop once, with its value and a native details block containing
Namespace, `Control` or `Part`, and logical source path.

Render every unknown projected Prop once under
`Weitere Metadaten (noch nicht fachlich eingeordnet)`, using the neutral label
`Metadatum` and showing name, value, namespace, origin, and path. Do not infer a
BSI designation from an unrecognized namespace.

- [x] **Step 4: Replace legacy metadata rendering**

Use `ControlMetadata` after the content sections. Remove the legacy
Control-level-only helpers, badges, technical identifier block, and
`renderProps` path from `ControlDetail` so projected Props are not duplicated
and `control.class` is not mislabeled.

- [x] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run src/components/ControlDetail.test.tsx
```

Expected: both component tests pass without console warnings.

- [x] **Step 6: Run full verification**

Run:

```bash
npm run lint
npx vitest run
npm run build
git status --short --branch
```

Expected: lint exits 0, all tests pass, Vite production build succeeds, and
only the intended uncommitted files are present.

The first production build exposed that `vitest.setup.ts` was outside the
TypeScript program, so jest-dom's Vitest matcher types were unavailable to
`tsc`. Adding the existing setup file to `tsconfig.json`'s `include` fixed the
root cause; the complete verification was then rerun successfully.

# Forge — Implementation Plan

> Ponytail mode: minimum code that works. Stdlib first. No speculative abstraction.
> `ponytail:` comments mark intentional shortcuts with known ceilings.

---

## How to use this plan

Each phase is self-contained. Implement in order — later phases assume earlier ones
are done. Each task lists exact files, the minimal change, and the pitfall to
avoid. If a task says "one line", do not add more.

**Conventions used in this file:**
- `[file.tsx:N]` = file path and line number
- `→` = replace with
- `ponytail:` = intentional simplification, only upgrade if measured ceiling hits

---

## Phase 0 — Critical Bug Fixes (Day 1, ~1 hour)

> Fix the 7 bugs that make the existing 15% unreliable. No new features.

### 0.1 — Fix proxy.ts route matcher + auth pattern

**Problem:** `proxy.ts:5` has `createRouteMatcher([])` — empty array, matches
nothing. No route is protected at the proxy level. Auth relies entirely on
server-action redirects inside each action. Additionally uses
`redirectToSignIn()` (Clerk v6 pattern) instead of `await auth.protect()`
(Clerk v7).

**Important:** On Next.js 16+, the network-boundary file is `proxy.ts`,
not `middleware.ts`. Next.js 16 deprecated `middleware.ts` in favor of
`proxy.ts` (see: https://nextjs.org/docs/messages/middleware-to-proxy).
Clerk v7 docs confirm: *"Name the middleware file by the `next` version:
`proxy.ts` on Next.js 16+, `middleware.ts` on 15 and below."*
(https://clerk.com/docs/nextjs/getting-started/quickstart)

Do NOT rename the file. Fix the content instead.

**Change** — replace entire `proxy.ts` content:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/submit/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**What changed:**
- `createRouteMatcher([])` → `createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/submit/(.*)"])` with public routes whitelisted
- `redirectToSignIn()` + manual userId check → `await auth.protect()` (Clerk v7 pattern)
- Removed dead commented-out exports

**One file.** Test by visiting `/` unauthenticated — should redirect to `/sign-in`.

**Pitfall:** `NEXT_PUBLIC_CLERK_SIGN_IN_URL` must be set correctly or
`auth.protect()` can't find the sign-in page. In monorepo setups, env vars
may not propagate to the proxy runtime — verify with a quick test.
See https://github.com/clerk/javascript/issues/8302

### 0.2 — Increment form.submissions on submit

**Problem:** `SubmitForm` in `actions/form.ts:210-231` creates `FormSubmission`
records but never increments `form.submissions`. Dashboard always shows 0.

**Fix** — add `.update()` after `.create()`:

```ts
// actions/form.ts:225-230  —  before the closing brace of SubmitForm
await db.formSubmission.create({
  data: { formId: form.id, content },
});
await db.form.update({          // ← ADD THIS
  where: { id: form.id },
  data: { submissions: { increment: 1 } },
});
```

**One line** (plus `where`). Do not wrap in a transaction — the two operations
being slightly out of sync is acceptable at this scale.
`ponytail: eventual consistency, wrap in tx if counter drift becomes measurable.`

### 0.3 — Block draft form access

**Problem:** `GetFormContentByUrl` (`actions/form.ts:192-208`) doesn't filter
`published: true`. Anyone with a shareURL can submit a draft.

**Fix** — add `published: true` to the `where` clause:

```ts
// actions/form.ts:194  —  add published filter
const response = await db.form.update({
  where: {
    shareURL: formUrl,
    published: true,          // ← ADD THIS
  },
  select: { content: true },
  data: { visits: { increment: 1 } },
});
```

**One line.** If form is draft, `update` finds no record → returns `null` →
`page.tsx` throws "Form not found" → `error.tsx` renders. Good enough.

### 0.4 — Save content before publishing

**Problem:** `Publish` button (`publish.tsx`) calls `PublishForm(id)` which only
sets `published: true`. Current canvas content is NOT saved. Published form has
stale elements.

**Fix** — in `publish.tsx`, serialize + save elements before calling PublishForm:

```ts
// publish.tsx  —  import useDesigner, serialize elements
const { elements } = useDesigner();

const publishForm = async () => {
  try {
    const jsonElements = JSON.stringify(elements);
    await UpdateFormContent(id, jsonElements);  // save first
    await PublishForm(id);                       // then publish
    // ... rest unchanged
  }
```

**3 lines added** to `publish.tsx`. Import `UpdateFormContent` already exists at
the module level? Check. If not, add the import.

### 0.5 — Remove artificial 500ms loading delay

**Problem:** `form-builder.tsx:90` has `setTimeout(() => setIsReady(true), 500)`.
Forces a half-second spinner even when data loads instantly.

**Fix** — remove the timeout, call `setIsReady(true)` immediately after state init:

```ts
// form-builder.tsx:84-92  —  replace the useEffect
useEffect(() => {
  if (isReady) return;
  const elements = JSON.parse(form.content);
  setElements(elements);
  setSelectedElement(null);
  setIsReady(true);           // ← was setTimeout(() => setIsReady(true), 500)
  // ponytail: no loading delay; serves no purpose
}, [form, setElements, setSelectedElement, isReady]);
```

**One line changed.** Also remove the `clearTimeout` in the return cleanup.

### 0.6 — Fix SelectField extraAttributes reference

**Problem:** `select-field.tsx:110` returns `extraAttributes` directly (shared
reference). Editing one SelectField changes all of them. Compare with
`checkbox-field.tsx` which spreads: `{ ...extraAttributes }`.

**Fix** — add spread in `construct()`:

```ts
// select-field.tsx:107-111
construct: (id: string) => ({
  id,
  type,
  extraAttributes: { ...extraAttributes },  // ← was: extraAttributes
}),
```

**One line.** Audit all 14 field files for the same bug. Fields that spread
(`...extraAttributes`) are correct. Fields that pass the reference directly:
- `components/fields/text-field.tsx` — check
- `components/fields/date-field.tsx` — check
- All others — check and fix same way.

### 0.7 — Register SliderField in sidebar

**Problem:** `SliderField` is registered in `FormElements` but missing from
`form-element-sidebar.tsx` grid. Users cannot add it.

**Fix** — add the missing import + entry in the sidebar grid:

```ts
// components/form-element-sidebar.tsx  —  add to imports
import { SliderFieldFormElement } from "@/components/fields/slider-field";

// Add to the grid array alongside other fields
```

**2 lines.** Match the existing pattern of other field entries.

---

## Database Schema — What to change (across all phases)

> Ponytail principle: don't touch the DB unless forced. JSON `content` field
> already stores everything (conditions, pageId, tracking). Only 2 changes
> needed across all 6 phases.

### Current schema

```prisma
model Form {
  id            String           @id @default(uuid())
  userId        String
  published     Boolean          @default(false)
  name          String
  description   String           @default("")
  content       String           @default("[]")
  visits        Int              @default(0)
  submissions   Int              @default(0)
  shareURL      String           @unique @default(uuid())
  FormSubmission FormSubmission[]
  createdAt     DateTime         @default(now())
  @@unique([name, userId])
}

model FormSubmission {
  id        String   @id @default(uuid())
  formId    String
  form      Form     @relation(fields: [formId], references: [id])
  content   String
  createdAt DateTime @default(now())
}
```

### Change A — Remove `@@unique([name, userId])`

```diff
- @@unique([name, userId])
```

**Why:** When a user creates two forms with the same name, Prisma throws a raw
unique constraint error with no user-facing message. The app never catches it.
Users see a generic "Something went wrong" toast. Removing the constraint is
safe — duplicate names don't break anything and users can rename later.

`ponytail: remove constraint over duplicate-name UX dialog; add client-side
name dedup if users actually hit this.`

### Change B — Optional `lastPageReached` on FormSubmission (Phase 5)

```diff
model FormSubmission {
   id        String   @id @default(uuid())
   formId    String
   form      Form     @relation(fields: [formId], references: [id])
   content   String
+  lastPageReached Int  @default(0)
   createdAt DateTime @default(now())
}
```

**Ponytail says:** Defer this. Store `lastPageReached` inside the `content`
JSON blob instead (`{ ...formValues, lastPageReached: 3 }`). Only add the
DB column when you need to query it across thousands of submissions and JSON
extraction becomes a bottleneck.

`ponytail: lastPageReached in content JSON; DB column once you query it
separately from form values.`

### What about templates? (Phase 4)

Static JSON file only. No DB model:

```ts
// lib/templates.ts — static, no migration, no Prisma
// Each entry: { id, name, description, category, elements }
```

`ponytail: static JSON; FormTemplate model when users contribute templates.`

### Schema change summary

| Phase | Change | Required? | Lines |
|-------|--------|-----------|-------|
| 0 | Remove `@@unique([name, userId])` | Yes — prevents silent 500s | 1 delete |
| 0 | Fix `proxy.ts` logic (not filename) | Yes — auth broken | ~15 lines |
| 1-4 | None | N/A | 0 |
| 5 | `lastPageReached` column | Defer to JSON blob | 0 for now |
| 6 | None | N/A | 0 |

**Total required schema changes: 1 line deleted.** Everything else fits in JSON.

---

## Phase 1 — Conditional Logic (Week 1, ~3 days)

> The feature that makes a "form builder" a real form builder. Without this,
> Forge is a drag-and-drop toy.

### 1.1 — Data model

A condition says: "If field X equals Y, then show/hide field Z."

Store conditions on the *target* element (not the source). This makes evaluation
O(n) instead of O(n²) — each element checks its own condition against its
dependency field's current value.

**Data structure** (add to each element's `extraAttributes`):

```ts
// In each field file's extraAttributes, ADD:
// (or define once in a shared type)
type Condition = {
  fieldId: string;          // the field whose value we check
  operator: "equals" | "not_equals" | "contains" | "empty" | "not_empty";
  value: string;            // the value to compare against
  action: "show" | "hide";  // what to do when condition matches
};

// Add `condition?: Condition` to extraAttributes
// Default: undefined (element always visible)
```

**Where to put it:** A shared type in `components/form-elements.tsx`. Each field's
`extraAttributes` gets an optional `condition` field. Default is `undefined`.

**One shared type, one optional field per element.** Not a separate conditions
table, not a rules engine, not a JSON blob in form content.
`ponytail: per-element conditions; centralized rule graph if 50+ conditions.`

### 1.2 — Condition UI in Properties Panel

Add a "Visibility" section at the bottom of each field's `PropertiesComponent`.
This is a shared component — do NOT copy-paste it into all 14 field files.
`ponytail: shared ConditionEditor component reused by all fields.`

**New file:** `components/condition-editor.tsx`

```tsx
// A dropdown + input for setting a condition on the current element.
// Shows:
//   "Show/Hide this field when [field dropdown] [operator dropdown] [value input]"
//
// Field dropdown: lists all OTHER elements in the form (filter out self).
// Operator dropdown: equals / not equals / contains / empty / not empty
// Value input: shown only when operator is equals / not_equals / contains
// Action toggle: show / hide
//
// On change: calls updateElement() with the new condition on extraAttributes.
//
// ponytail: single-condition per element; AND/OR groups if users ask for it.
```

**Implementation:**

```tsx
"use client";
import { useFormContext } from "react-hook-form"; // or pass callbacks
import useDesigner from "@/hooks/useDesigner";

export function ConditionEditor({ element }: { element: FormElementInstance }) {
  const { elements, updateElement } = useDesigner();
  const others = elements.filter((e) => e.id !== element.id);

  const condition = (element.extraAttributes as any)?.condition;

  const setCondition = (partial: Partial<Condition>) => {
    const updated = { ...element };
    (updated.extraAttributes as any).condition = { ...condition, ...partial };
    updateElement(element.id, updated);
  };

  const clearCondition = () => {
    const updated = { ...element };
    delete (updated.extraAttributes as any).condition;
    updateElement(element.id, updated);
  };

  return (
    <div className="space-y-2 border rounded p-3">
      <div className="flex items-center justify-between">
        <Label>Visibility</Label>
        {condition && (
          <Button variant="ghost" size="sm" onClick={clearCondition}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {condition ? (
        <div className="space-y-2">
          <Select
            value={condition.action}
            onValueChange={(v) => setCondition({ action: v as "show" | "hide" })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="show">Show</SelectItem>
              <SelectItem value="hide">Hide</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={condition.fieldId}
            onValueChange={(v) => setCondition({ fieldId: v })}
          >
            <SelectTrigger><SelectValue placeholder="When field..." /></SelectTrigger>
            <SelectContent>
              {others.map((el) => (
                <SelectItem key={el.id} value={el.id}>
                  {el.extraAttributes?.label || el.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={condition.operator}
            onValueChange={(v) => setCondition({ operator: v as Condition["operator"] })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">equals</SelectItem>
              <SelectItem value="not_equals">not equals</SelectItem>
              <SelectItem value="empty">is empty</SelectItem>
              <SelectItem value="not_empty">is not empty</SelectItem>
            </SelectContent>
          </Select>
          {condition.operator !== "empty" && condition.operator !== "not_empty" && (
            <Input
              value={condition.value}
              onChange={(e) => setCondition({ value: e.target.value })}
              placeholder="Value"
            />
          )}
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setCondition({ action: "show", fieldId: others[0]?.id || "", operator: "equals", value: "" })}>
          <Plus className="h-3 w-3 mr-1" /> Add Condition
        </Button>
      )}
    </div>
  );
}
```

Integrate into each `PropertiesComponent` by adding `<ConditionEditor element={element} />` before the Save button. All 14 field files need this import + one line of JSX.

**Pitfall:** Do NOT create a base class or wrapper. The ponytail way is to add
the same line to 14 files — it's copy-paste, not an abstraction worth defending.
`ponytail: 14 identical additions, worth it; extracted wrapper if it changes 3+ times.`

### 1.3 — Evaluation in FormComponent

When rendering a form field at runtime, evaluate its condition and skip rendering
if it should be hidden.

**Pattern** — add to each `FormComponent` (or, slightly better, to the parent
`FormSubmit` component):

In `components/form-submit.tsx:89-100`, before rendering each element:

```tsx
{content.map((element) => {
  const cond = (element.extraAttributes as any)?.c
  ondition;
  if (cond) {
    const depValue = formValues.current[cond.fieldId] || "";
    const depField = content.find((f) => f.id === cond.fieldId);
    if (depField) {
      const matches = checkCondition(cond, depValue);
      if (cond.action === "hide" && matches) return null;
      if (cond.action === "show" && !matches) return null;
    }
  }
  const FormElement = FormElements[element.type].formComponent;
  return ( /* render as before */ );
})}
```

The `checkCondition` helper is a pure function:

```ts
// lib/condition.ts  —  15 lines, pure, no deps
function checkCondition(cond: Condition, actualValue: string): boolean {
  switch (cond.operator) {
    case "equals":     return actualValue === cond.value;
    case "not_equals": return actualValue !== cond.value;
    case "contains":   return actualValue.includes(cond.value);
    case "empty":      return actualValue.length === 0;
    case "not_empty":  return actualValue.length > 0;
    default:           return true;
  }
}
```

`ponytail: switch, not a strategy pattern. 5 ops; add when needed.`

### 1.4 — Designer preview of condition

In `DesignerComponent` (the canvas preview), show a small badge like
"Shown/hidden based on [field name]" when `condition` is set. This tells the
builder that logic exists without needing to run it visually.

```tsx
// In each DesignerComponent, add after the main content:
{condition && (
  <Badge variant="outline" className="text-xs">
    {condition.action === "hide" ? "Hidden" : "Shown"} when {condition.fieldId === "..."
  </Badge>
)}
```

**Pitfall:** Showing the actual field name requires looking up the field in
context. Keep it simple — show the field ID or index. Fancy name resolution
is a nice-to-have.

---

## Phase 2 — Auto-Save + UX (Week 1, ~2 days)

> Remove the Save button. Auto-save with debounce. Add undo/redo for element ops.

### 2.1 — Auto-save with debounce

**Current:** `save.tsx` has a button that calls `UpdateFormContent`.

**Target:** Whenever `elements` change, start a 2-second debounce timer. If no
new changes arrive within 2 seconds, auto-save.

**Implementation:**

In `form-builder.tsx`, add a `useEffect` on `elements`:

```tsx
// form-builder.tsx  —  add after the existing init useEffect
const [lastSaved, setLastSaved] = useState<Date>(new Date());

useEffect(() => {
  if (!isReady) return;
  const timer = setTimeout(async () => {
    const jsonElements = JSON.stringify(elements);
    // ponytail: fire-and-forget; errors shown in toast
    try {
      await UpdateFormContent(form.id, jsonElements);
      setLastSaved(new Date());
    } catch {
      toast({ title: "Auto-save failed", variant: "destructive" });
    }
  }, 2000);
  return () => clearTimeout(timer);
}, [elements, isReady, form.id]);
```

**What to remove:**
- `save.tsx` — delete the file entirely
- The `<SaveBtn />` from `form-builder.tsx`
- `UpdateFormContent` import if no longer used elsewhere (it's still used by publish)

**What to add:**
- An "unsaved" indicator in the nav bar (small dot or "Saving..." / "Saved" text)
- Use a `isDirty` ref to track whether there are unsaved changes

**Pitfall:** The `elements` reference from `useDesigner()` changes on every
modification. The debounce works correctly because the `useEffect` cleanup
cancels the previous timeout. Do NOT add a separate "dirty" tracking —
`isReady` + `elements` length check is sufficient.

### 2.2 — Undo/Redo

**Simplest approach:** Store a history stack alongside elements. Each mutation
pushes the previous state onto the stack.

**In `designer-context.tsx`:**

```tsx
// Add state
const [history, setHistory] = useState<FormElementInstance[][]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);

// Wrap addElement/removeElement/updateElement to push undo states
const pushHistory = useCallback((prevElements: FormElementInstance[]) => {
  setHistory((h) => [...h.slice(0, historyIndex + 1), prevElements]);
  setHistoryIndex((i) => i + 1);
}, [historyIndex]);

// Modify addElement:
const addElement = useCallback((index: number, element: FormElementInstance) => {
  pushHistory(elements);
  setElements((prev) => { ... });
}, [elements, pushHistory]);

// Add undo/redo functions to the context value:
const undo = useCallback(() => {
  if (historyIndex < 0) return;
  setElements(history[historyIndex]);
  setHistoryIndex((i) => i - 1);
}, [history, historyIndex]);

const redo = useCallback(() => {
  if (historyIndex >= history.length - 1) return;
  setHistoryIndex((i) => i + 1);
  setElements(history[historyIndex + 1]);
}, [history, historyIndex]);
```

**Keyboard shortcuts** in `form-builder.tsx`:

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();  // supress browser save dialog
      // auto-save handles this; no-op
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [undo, redo]);
```

**Pitfall:** History stores full element arrays. With 100 elements × 100 history
entries, that's ~10k objects. This is fine for single-user editing.
`ponytail: in-memory undo stack; persisted undo if users complain about losing
history on page refresh.`

**Do NOT:** Add a separate undo/redo library. The entire feature is ~40 lines
of state management. `use-undo` or similar is YAGNI.

---

## Phase 3 — Multi-Page Forms (Week 2, ~4 days)

> Single-page form → step-based conversational format. Improves completion rates
> by 20-40%.

### 3.1 — Data model

Split elements into pages. Simplest approach: add a `pageId` field to each
element's `extraAttributes`. Default is `"page_0"`.

```ts
// In each field's extraAttributes, ADD:
pageId: "page_0",  // string; all elements on same page share the same pageId
```

When the builder creates a new page, it assigns a new UUID as `pageId`.
Elements on the new page get that UUID. The form renderer groups elements by
`pageId` and shows one page at a time.

`ponytail: flat array with pageId grouping; separate table if element-level
reordering across pages becomes a bottleneck.`

### 3.2 — Builder UI for pages

In `form-builder.tsx`, add a page navigator between the nav and the canvas:

```tsx
// Tabs or page indicators at the top of the canvas
// "Page 1" | "Page 2" | "+ Add Page"
// Clicking a page filters the elements array to show only that page's elements.
```

State:

```tsx
const [currentPage, setCurrentPage] = useState("page_0");
const filteredElements = elements.filter((e) => e.extraAttributes?.pageId === currentPage);
// Pass filteredElements to <Designer /> instead of elements
```

The `<DesignerSidebar />` needs to know the current page so new elements get the
correct `pageId`.

**Minimal change:** Pass `currentPage` to `useDesigner()` or add it to context.
Or simpler: add `currentPage` as a separate React state in `FormBuilder` and
pass it down. Context is overkill.

`ponytail: prop drilling for currentPage; context if it reaches 5+ levels deep.`

### 3.3 — Page management

Add/remove/rename pages in a simple page list.

```tsx
// lib/pages.ts  —  pure functions, no React
function getUniquePages(elements: FormElementInstance[]): string[] {
  const pages = new Set(elements.map((e) => (e.extraAttributes as any)?.pageId || "page_0"));
  return Array.from(pages).sort();
}

function assignToPage(elements: FormElementInstance[], pageId: string): FormElementInstance[] {
  return elements.map((e) => ({ ...e, extraAttributes: { ...e.extraAttributes, pageId } }));
}
```

**Add page button:** Creates a new UUID, moves no elements. The current "Add"
from sidebar puts elements on the currently viewed page.

**Remove page button:** Moves all elements on that page to the previous page,
then deletes the page ref.

### 3.4 — Form renderer (multi-step)

In `FormSubmit`, instead of rendering all elements at once, group by `pageId`
and show one page at a time:

```tsx
// form-submit.tsx  —  replace direct content.map with page-aware rendering
const pages = getUniquePages(content);
const [currentPageIndex, setCurrentPageIndex] = useState(0);
const currentPageElements = content.filter(
  (e) => (e.extraAttributes as any)?.pageId === pages[currentPageIndex]
);

// Render currentPageElements...
// "Next" button advances page, validates current page first
// "Back" button goes to previous page
// Last page shows "Submit" instead of "Next"
```

**Validation:** When clicking "Next", validate only the current page's fields.
If any fail, show errors and stay on the page.

**Implementation** — modify `validateForm` to take a filter:

```tsx
const validatePage = (pageElements: FormElementInstance[]): boolean => {
  for (const field of pageElements) {
    const actualValue = formValues.current[field.id] || "";
    const valid = FormElements[field.type].validate(field, actualValue);
    if (!valid) formErrors.current[field.id] = true;
  }
  return Object.keys(formErrors.current).length === 0;
};
```

**Pitfall:** Do NOT use React Router or URL params for pages. This is client-side
page state. URL-based pagination is only needed if users want direct links to a
specific page (YAGNI for now).

### 3.5 — Progress indicator

In `FormSubmit`, show a simple progress bar at the top:

```tsx
<div className="w-full bg-secondary h-2 rounded-full">
  <div
    className="bg-primary h-2 rounded-full transition-all"
    style={{ width: `${((currentPageIndex + 1) / pages.length) * 100}%` }}
  />
</div>
```

**One div.** No animation library, no progress bar component, no percentage text.
`ponytail: <div> with width%; animated progress bar if branded requirement appears.`

---

## Phase 4 — Templates (Week 3, ~2 days)

> Save any form as a template. Load from template when creating a new form.
> Skip if users don't ask for it — YAGNI applies here.

### 4.1 — Template data model

Templates are just forms with a `isTemplate: boolean` flag. Or simpler: store
templates separately. Lazy approach: add a `templateId` column to the `Form`
model and a separate `FormTemplate` model.

Actually THE LAZIEST approach: seed templates as `Form` records for a special
"template" user. The dashboard filters them out by checking a flag.

**Even lazier:** Add `templateJson: String` to the CreateForm dialog. When user
selects "start from template", paste the template JSON into the new form's
initial `content`. No DB model change.

**Choose:** Do NOT add a DB model. Store a static JSON file of templates.

```ts
// lib/templates.ts  —  static file, 50 lines max
// Each template is { name, description, elements: FormElementInstance[] }
// Export a list of templates.
// When user picks one, the elements become the new form's content.
```

`ponytail: static JSON templates; DB-backed template system if users contribute
templates at scale.`

### 4.2 — Template selection in Create Form

Add a "Start from template" tab to the `CreateFormButton` dialog:

```tsx
// In create-form-btn.tsx, add tabs:
// "Blank Form" | "From Template"
// When "From Template" is selected, show a grid of template cards.
// Clicking a template sets the initial content to the template's elements.
// The form name gets pre-filled from the template name.
```

**UI:** Use shadcn `<Tabs>` component. Template grid is 3-column, each card
shows name + description. Click selects, click "Create" saves.

### 4.3 — Save as template

In the form details page (`/form/[id]`), add a "Save as Template" button:

```tsx
// On click: serializes current content, prompts for name
// Saves to localStorage under "forge-templates"
// The "From Template" dialog reads from localStorage
```

`ponytail: localStorage; shared template library if multi-user demand.`

---

## Phase 5 — Analytics & Export (Week 3-4, ~2 days)

### 5.1 — Fix submission tracking (Phase 0.2 ensures counter works)

Already done in Phase 0.2. Verify by submitting a form and checking the
dashboard — submissions should increment.

### 5.2 — Basic analytics on form details page

The current `/form/[id]` page shows 4 stat cards. Add a simple table showing
each submission with: submitted at, total fields filled, completion status.

**No charts, no graphs.** Just a table with the data that already exists.

### 5.3 — Drop-off tracking (requires multi-page from Phase 3)

Once multi-page exists, track which page users reach:

```ts
// In FormSubmit, fire a server action on each page change:
// onSubmitPage(pageIndex) → stores lastPageReached on FormSubmission
// This shows "10 users reached page 2, 5 reached page 3"
```

**Server action:**

```ts
export async function TrackPageProgress(formId: string, pageIndex: number) {
  // Stores the highest page reached for analytics
  // Simple: update a `lastPageReached` field on FormSubmission
  // Even simpler: just log it, display in the stats page
}
```

### 5.4 — CSV export (already done)

Phase 0 already replaced xlsx with native CSV. The export exists at
`client-table.tsx`. Verify it works and the button label says "Download CSV".

**No XLSX export.** CSV is universally readable. XLSX requires a 600KB+ dep.
`ponytail: CSV is fine; XLSX if a paying customer demands it.`

---

## Phase 6 — Embed & Sharing (Week 4, ~1 day)

### 6.1 — Inline embed iframe

Generate an `<iframe>` snippet on the form details page:

```tsx
// In form-link.tsx or a new file:
const iframeCode = `<iframe src="${window.location.origin}/submit/${form.shareURL}" width="100%" height="600" frameborder="0"></iframe>`;
```

Show it in a read-only textarea with a "Copy" button.

**2 lines of code.** The iframe works because the submit page is fully public
and self-contained.

`ponytail: raw iframe; React embed SDK if tracking/events are needed.`

### 6.2 — QR code

Generate a QR code URL using a public API (no QR library needed):

```tsx
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
<img src={qrUrl} alt="QR Code" />
```

**1 line.** If the QR API is down, the image fails silently — acceptable.
`ponytail: public QR API; self-hosted QR if dependency on external service
becomes a problem.`

---

## Appendix A: Code Style & Conventions

- **No comments in production code.** Delete all docstring blocks (`/** ... */`)
  that explain what the code does. Keep only comments that explain WHY
  (e.g., `ponytail:` markers, bug workarounds).
- **No barrel exports** (`index.ts` files). Import directly from source files.
- **No default exports** except for Next.js pages and layouts.
- **`ponytail:` comments** on every intentional simplification, with the ceiling
  named: `// ponytail: X; upgrade when Y.`
- **One component per file** unless the helper is trivial (<5 lines).
- **`use client`** on every file that uses hooks. No mixing RSC/RCC in one file.

## Appendix B: Dependency Decisions

| Use case | Choice | Why |
|----------|--------|-----|
| Icons | `@radix-ui/react-icons` only | Smallest, already 27 imports |
| Spinners | `<Loader2 className="animate-spin" />` from lucide-react | Already present |
| Date formatting | `date-fns` | Already present, tree-shakeable |
| Forms | React Hook Form + Zod | Already present |
| Drag & drop | `@dnd-kit` | Already present, no alternative |
| CSV | Native `Blob` + `URL.createObjectURL` | Stdlib, zero deps |
| QR code | `https://api.qrserver.com` API | Zero deps |
| Undo/redo | Custom ~40 lines | No library needed |
| Conditional logic | Custom ~50 lines | No library needed |

**NEVER add:** lodash, moment, axios, redux, zustand (for now), react-query,
recharts, any CSS framework beyond Tailwind.

## Appendix C: Common Pitfalls

1. **`extraAttributes` reference sharing** — Every `construct()` must spread
   `{ ...extraAttributes }`. Failing to do so causes all instances of a field
   type to share state. This is the #1 bug pattern in Forge.

2. **Server action redirect in try/catch** — `redirect("/sign-in")` throws a
   special error. If wrapped in try/catch, the redirect doesn't work. Only
   call `redirect()` outside try blocks.

3. **Next.js 16 dynamic params** — `params` is now a `Promise`, must be `await`ed:
   `const { id } = await params;`. Forgetting this breaks all page components.

4. **`updateMany` returns `{ count }`** — Unlike `update` (returns the record),
   `updateMany` returns `{ count: number }`. The current code in Phase 0.2/0.3
   uses `update` for this reason. Only use `updateMany` when you don't need
   the returned record.

5. **JSON.parse on empty content** — `form.content` defaults to `"[]"` in schema.
   If a form has never been saved, parse works fine. But if content somehow
   becomes `""` (edge case), `JSON.parse("")` throws. Guard with
   `JSON.parse(form.content || "[]")`.

6. **`useTransition` with server actions** — Server actions called inside
   `startTransition` work, but errors must be caught inside the action or in
   the callback. Uncaught errors crash the transition silently. Always wrap
   server action bodies in try/catch.

7. **`crypto.randomUUID()` availability** — Works in modern browsers and
   Node 19+. Forge targets these. If SSR fails, ensure the component is
   `"use client"` and not rendered on the server. `idGenerator` is only used
   in client components — verified safe.

8. **`proxy.ts` vs `middleware.ts`** — Next.js 16+ renamed the file convention
   from `middleware.ts` to `proxy.ts` (https://nextjs.org/docs/messages/middleware-to-proxy).
   Clerk v7 follows this: *"proxy.ts on Next.js 16+, middleware.ts on 15 and below."*
   On Next.js 16, `proxy.ts` is the only recognized name. Do NOT rename it to
   `middleware.ts` — that would be silently ignored. The current `proxy.ts`
   filename is correct; only the route matcher logic inside it needs fixing.

## Appendix D: After Implementation Checklist

Run these before declaring any phase done:

```bash
npm run build    # must pass with zero errors
npm run lint     # must pass
```

Manually test:
1. Create form → add fields → save → refresh → fields persist
2. Publish form → share URL → submit → submission counted
3. Dashboard shows correct stats
4. Build succeeds (`npm run build`)

# Timely Forms AI — Form Builder Frontend Analysis Report

**Project:** `ai-form-builder-ui-boilerplate-code-main`
**Scope:** Full sweep of the form-builder frontend (`src/`), emphasis on UI features.
**Mode:** Mock data / zero backend — all data is in-memory and session-persistent.
**Total source size:** 63 files, ~8,100 LOC (`.jsx`/`.js`/`.css` under `src/`).

---

## 1. What this is

A **fully clickable, frontend-only form-builder application** ("Timely Forms AI")
with a deliberately crafted architecture: the real app's `src` copied verbatim, with
only the **network layer swapped for an in-memory mock backend**. Every screen —
auth, dashboard, form CRUD, drag-and-drop builder, response table, analytics
dashboards, inbox, templates, settings, and the public fillable form — works end to
end against fake data with simulated latency, so loading states, skeletons, and
"AI thinking" flows are all demonstrable.

The stated design goal (`BOILERPLATE.md`): the app is the **real frontend**; to go
live you only swap `src/services/index.js`, `src/lib/api.js`, and delete
`src/services/mockData.js`. No component/page/hook/route changes.

---

## 2. Tech stack

| Concern | Choice |
| --- | --- |
| Build | Vite 8 + `@vitejs/plugin-react` + `@tailwindcss/vite` |
| Framework | React 19.2 (function components, hooks) |
| Language | Plain JSX — **no TypeScript** (types are implicit / JSDoc-less) |
| Routing | `react-router-dom` v7 (`BrowserRouter`, code-split `lazy()` routes) |
| Styling | Tailwind CSS v4 (`@theme`, `@utility`, class-based dark mode) |
| Forms (auth) | `react-hook-form` |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` |
| Charts | `recharts` 3 (area/bar/pie/donut) + hand-rolled SVG (gauge, heatmap, decor) |
| Icons | `lucide-react` |
| Toasts | `sonner` (top-center, rich colors) |
| HTTP | `axios` (installed but **unused in mock mode** — only in the commented REAL block) |
| Class utils | `clsx` + `tailwind-merge` (`cn()`) |
| Lint | `oxlint` (`npm run lint`) |

---

## 3. Architecture

### 3.1 Layering

```
src/
├── main.jsx            → Provider stack: Theme → Auth → Router → App + <Toaster>
├── App.jsx             → All routes (lazy pages), ProtectedRoute + DashboardLayout shell
├── layouts/            → DashboardLayout (rail/header), ProtectedRoute (auth guard)
├── pages/              → 15 route components (one per screen)
├── components/
│   ├── ui/             → 9 primitives (Button, Input, Modal, Drawer, Dropdown…)
│   ├── public/         → FormView, FieldRenderer, FormArtPanel (fillable form renderer)
│   ├── builder/        → 6 builder-specific parts (palette, sortable, settings…)
│   ├── forms/          → FormsBrowser, FormCard, FormPageHeader, TemplatePreview
│   ├── analytics/      → KpiCard, ChartCard, Funnel, QuestionChart, Charts
│   └── dashboard/      → NavCard, CardDecor
├── contexts/           → AuthContext, ThemeContext
├── hooks/              → useAuth, useTheme, useForms, useHistoryState, useDebounce
├── lib/                → fieldTypes, themes, templates, validate, charts, utils, api
└── services/           → index.js (API groups) + mockData.js (fake backend)
```

### 3.2 Data-flow principle

One **service module** (`src/services/index.js`) is the single seam between UI and
data. It exports five API groups (`authApi`, `formApi`, `responseApi`,
`insightsApi`, `aiApi`) with **identical names/signatures/return shapes in both
MOCK and REAL modes**. Pages import these groups directly; no component knows or
cares whether data comes from memory or HTTP.

```
UI pages/components
        │  imports only
        ▼
src/services/index.js  (authApi / formApi / responseApi / insightsApi / aiApi)
        │
   ┌────┴─────────────────────┐
   │ MOCK MODE (active)        │   REAL MODE (commented, flip by uncommenting)
   ▼                           ▼
mockData.js  (in-memory store)  lib/api.js  (axios client, JWT interceptors)
                                → Express/Neon backend (implied by REST paths)
```

### 3.3 Mock latency

- Normal calls: `net()` → **300–650ms** random.
- "AI" / heavy calls: `slow()` → **900–1500ms**.
- This keeps spinners, skeletons, and "generating…" states genuinely visible.

### 3.4 Session persistence

Mock data lives in a module-level `store` built once on load. Mutations
(create/edit/duplicate/delete/publish/favorite/archive/response) persist until
**page refresh**. Auth token is persisted in `localStorage` (`formly_token`), so
refresh keeps you logged in — but all content resets.

---

## 4. Routing map

| Route | Page | Guard / shell |
| --- | --- | --- |
| `/login` | Login | `PublicOnlyRoute` (redirects to `/dashboard` if authed) |
| `/register` | Register | `PublicOnlyRoute` |
| `/f/:slug` | **PublicForm** (public fillable form) | none — public |
| `/builder/new` | Builder (creates then redirects to `/builder/:id`) | `ProtectedRoute`, full-screen |
| `/builder/:id` | Builder | `ProtectedRoute`, full-screen (no dashboard shell) |
| `/builder/new?ai=1` | Builder + AI generate modal auto-open | `ProtectedRoute` |
| `/dashboard` | Dashboard | `DashboardLayout` |
| `/forms` | MyForms | `DashboardLayout` |
| `/insights` | Insights (global) | `DashboardLayout` |
| `/inbox` | Inbox | `DashboardLayout` |
| `/settings` | Settings | `DashboardLayout` |
| `/templates` | Templates | `DashboardLayout` |
| `/forms/:id/responses` | Responses | `DashboardLayout` |
| `/forms/:id/analytics` | Analytics | `DashboardLayout` |
| `/` | → redirect to `/dashboard` | — |
| `*` | NotFound (404) | — |

Notes:
- **Code-splitting:** all heavy pages (Builder, Analytics, charts, public
  renderer, Templates, Responses, Insights, Inbox, Settings, MyForms) are
  `React.lazy()`; Login/Register/Dashboard/NotFound are eagerly loaded. Each
  lazy route is wrapped in `<Suspense fallback={<PageLoader/>}>`.
- **Auth guard:** `ProtectedRoute` shows a "Restoring your session…" loader while
  re-validating the token, redirects to `/login` (remembering `state.from`) when
  unauthenticated. `PublicOnlyRoute` is the inverse.
- **Builder lives outside the dashboard shell** — it's a full-screen app-in-app.

---

## 5. Data model & types (the "schema")

The app is plain JS, but every object shape is well-defined by the mock store,
the field-type factory, and the REAL API paths. Below are the de-facto types.

### 5.1 User
```js
{ id, name, email, avatarColor: "#0c8b7c", createdAt: ISOstring }
```
Auth endpoints return `{ user, token }`. `updateProfile` returns the user;
`changePassword`/`deleteAccount` return `{ success, message }`.

### 5.2 Question / Field  (built by `createField` in `lib/fieldTypes.js`)
```js
{
  id: string,          // "q_<timestamp>_<seq>"
  type: FieldType,     // see §6
  label: string,
  placeholder: string,
  description: string, // helper text under the label
  helpText: string,    // shown below the field
  required: boolean,
  defaultValue: string,
  options: [{ id, label, value }],   // only for dropdown/radio/checkbox
  content: string,                   // only for heading/paragraph/image (static)
  validation: {
    minLength: number|null, maxLength: number|null,
    min: number|null, max: number|null,
    pattern: string,                 // regex source
    message: string,                 // custom error text
  },
}
```

### 5.3 Form
```js
{
  _id: string,            // "form_…"
  owner: string,          // "u_demo"
  title: string,
  description: string,
  theme: "minimal"|"modern"|"corporate"|"gradient"|"dark"|"glassmorphism",
  status: "published"|"draft",
  slug: string,           // public share slug → /f/:slug
  questions: Question[],
  settings: {
    logo: string,
    primaryColor: string,      // hex accent
    background: string,
    borderRadius: number,      // 0–28 px
    thankYouMessage: string,
    submitButtonText: string,
    seoTitle: string,
    seoDescription: string,
    showProgressBar: boolean,
  },
  views: number,
  responseCount: number,
  isFavorite: boolean,
  isArchived: boolean,
  publishedAt: ISOstring|null,
  createdAt: ISOstring,
  updatedAt: ISOstring,
}
```

### 5.4 Response
```js
{
  _id: string,            // "resp_…"
  form: string,           // form _id
  answers: [{ questionId, label, type, value }],  // value: string | string[] (checkbox) | number (rating)
  completionTime: number, // seconds
  meta: { userAgent: string, ip: string },
  submittedAt: ISOstring,
}
```
Inbox responses additionally carry `formId`, `formTitle`, `formColor`
(joined client-side from the form store).

### 5.5 Analytics shapes (computed server-side in the real app; mirrored in mock)

**Per-form** (`responseApi.analytics` → `{ stats, timeline, questions }`):
```js
stats:  { totalResponses, views, conversionRate, completionRate, avgCompletionTime }
timeline: [{ date: "YYYY-MM-DD", count }]
questions: [{
  id, label, type, total,
  // type-specific:
  breakdown: [{ label, count }],   // option types, rating/number, yes_no
  average?: number,                // rating/number
  samples?: string[],              // free text (last 5)
}]
```

**Global insights** (`insightsApi.overview` → `{ stats, timeline, heatmap, devices, topForms }`):
```js
stats:   { totalForms, published, totalResponses, totalViews, conversion, avgCompletionTime }
heatmap: [{ day: 0-6, hour: 0-23, count }]
devices: [{ label: Desktop|Mobile|Tablet, value }]
topForms:[{ id, title, theme, status, responses, views, conversion, color }]
```

**Inbox** (`insightsApi.inbox`): `{ responses: Response[], count }` — 300 newest,
searchable across answer text.

### 5.6 CSV export shape
Headers: `Submitted At, Completion Time (s), <each answerable question label>`.
Values escaped/quoted; arrays joined with `; `.

---

## 6. Field type system (`lib/fieldTypes.js`)

The **single source of truth** for every supported field type. Drives the palette,
the builder, validation, and the public renderer simultaneously.

**18 field types in 4 groups:**

| Group | Types | Notes |
| --- | --- | --- |
| **Inputs** | `short_text`, `long_text`, `email`, `phone`, `number`, `url`, `password`, `address` | text-ish controls; `email`/`url`/`number` get built-in validation |
| **Choices** | `dropdown`, `radio` (Multiple Choice), `checkbox`, `yes_no` | `hasOptions` types get a 3-option default and editable options |
| **Advanced** | `date`, `rating` (5-star), `file` | |
| **Layout** | `section` (divider), `heading`, `paragraph`, `image` | `static: true` — no answers, excluded from validation/analytics/CSV |

Helpers exported: `FIELD_DEFS`, `FIELD_GROUPS`, `STATIC_TYPES`, `OPTION_TYPES`,
`isStatic()`, `createField(type)`, `uid()`. Static types are filtered out of
validation, analytics, completion-rate math, CSV columns, and inbox snippets.

---

## 7. The mock backend (`src/services/mockData.js`, 598 LOC)

Throwaway file (deleted at go-live) that reimplements the backend behavior:

- **Seed data:** 8 sample forms (~940 responses) — customer feedback, employee
  satisfaction, restaurant, conference registration, market research, newsletter,
  a job application draft, and a course evaluation draft. Two are favorites, two
  are drafts.
- **Deterministic-ish generators:** names, emails, phone numbers, addresses,
  dates, ratings (weighted 5>4>3…), comments, yes/no (7:3), random checkbox picks,
  device UAs.
- **Analytics/insights/CSV** are computed **in the frontend**, mirroring the real
  backend's service layer (`computeAnalytics`, `computeInsights`, `computeInbox`,
  `toCsv`).
- **Unknown-form synthesis:** `getForm(id)` auto-creates a blank draft form for
  unknown IDs, so `/builder/:id` never hard-fails.
- **Sensible perms for demo:** `getPublicForm` throws for unpublished slugs;
  `submitResponse` appends + bumps `responseCount`; `removeResponse` decrements.
- **Mock AI** returns believable structured data: prompt-derived titles, canned
  question sets, per-type validation rules, improved-question rewrites with
  follow-up suggestions, and form summaries (purpose/audience/time/suggestions).

---

## 8. UI design system

### 8.1 Theme tokens (Tailwind v4 `@theme` in `index.css`)
- **Brand:** teal scale `brand-50…900` around `#0c8b7c`, gradient `#32b49f→#0c8b7c`
  exposed as `bg-brand-gradient` / `text-brand-gradient` utilities.
- **Decorative accents:** gold/coral/purple/blue (used by dashboard NavCards).
- **Shadows:** `soft` (subtle), `card` (lifted), `pop` (floating menus).
- **Animations:** `fade-in`, `slide-up`, `scale-in`, `pop`, `slide-in-right`.
- **Semantic CSS vars** for dark mode: `--app-bg`, `--surface`, `--surface-2`,
  `--border`, `--fg`, `--fg-muted` — surfaced as utility classes
  (`bg-app`, `bg-surface`, `text-fg`, `text-muted`, `border-default`).

### 8.2 Dark mode
Class-based (`html.dark`), default from `prefers-color-scheme`, persisted in
`localStorage("formly_theme")`. Toggle available in: sidebar rail, top header
icon, Settings page, and the command palette. Charts re-read the CSS vars
(`var(--border)`, `var(--fg-muted)`, `var(--surface)`) so they theme correctly.

### 8.3 UI primitives (`components/ui/`)
| Component | Features |
| --- | --- |
| `Button` | 6 variants (primary gradient, secondary, ghost, danger, outline, subtle) × 5 sizes (sm/md/lg/icon/icon-sm), `loading` spinner state, focus rings, active-scale press effect |
| `Input` / `Textarea` / `Select` | Shared focus glow + hover border, `invalid` (error) styling, custom chevron on Select, `Field`/`Label`/`FieldError` helpers |
| `Modal` | Portal, ESC close, backdrop blur, body scroll-lock, sizes sm→xl; `ConfirmModal` wrapper with danger confirm |
| `Drawer` | Right slide-in panel (portal), title/subtitle, footer slot, ESC close |
| `Dropdown` / `MenuItem` / `MenuDivider` | Click-outside close, floating `shadow-pop` panel, danger items |
| `Card` / `CardHeader` / `CardBody` / `StatCard` | Lifted hover cards; StatCard with icon chip accents |
| `Switch` | Accessible `role="switch"` toggle with label + description |
| `Avatar` | Initials avatar, size sm/md/lg, color prop |
| `Feedback` | `Spinner`, `PageLoader`, `Skeleton` (pulse), `Badge` (5 variants), `EmptyState` (icon/title/desc/action) |

---

## 9. Feature inventory — screen by screen

### 9.1 Auth (Login / Register / AuthLayout)
- Split-screen auth shell: left **marketing panel** (brand gradient, headline,
  4 highlight cards, footer), right form slot; collapses to form-only on mobile.
- **Login:** email + password with inline icons, RHF validation, full-width CTA
  with loading state, **"Fill demo credentials"** dashed button that populates the
  form through RHF (keeps validation in sync), link to Register, post-login
  redirect to `state.from` (deep-link aware).
- **Register:** name / email / password (min 6 chars) + hint text, welcome toast.

### 9.2 DashboardLayout (app shell)
- **Desktop rail** (64px, hover-expands to 256px): logo, "New form" gradient
  button, 6 nav items (Dashboard, My Forms, Insights, Inbox, Templates,
  Settings) with active-state inverse tiles, dark-mode toggle at the bottom.
- **Mobile drawer** overlay with full-width "New form" CTA.
- **Top header:** hamburger (mobile), **global search** pill with `⌘K` badge,
  inbox bell with unread dot, theme toggle, and a **profile dropdown** (avatar,
  name/email, Settings, Log out).
- **⌘K Command Palette** (`CommandPalette.jsx`): fuzzy-filtered actions
  (navigate, create blank form, generate with AI, switch theme, log out) + live
  form search (up to 6), arrow-key navigation, Enter to run, ESC to close.

### 9.3 Dashboard
- Time-based greeting ("Good morning/afternoon/evening") + "New form" CTA.
- **6 NavCards** (Create a form [hero gradient], AI Generator, Templates, All
  forms, Published, Drafts) with per-card accent color, count badges, and
  smooth-scroll jump-to-filter behavior.
- **4 StatCards:** Responses, Total views, Conversion %, Published.
- Embedded **FormsBrowser** with scroll-smooth anchor.

### 9.4 My Forms (and embedded FormsBrowser)
- Filter tabs: **All / Published / Drafts / Favorites / Archived** (controlled or
  self-contained), debounced search (300ms), responsive 1→2→3 column card grid.
- Skeletons while loading; contextual EmptyState (search vs. no forms) with
  "Blank form" / "Use AI" actions.
- **FormCard:** tinted gradient header strip + SVG corner motif (8 rotating
  color/motif combos), favorite star (fill on), status Badge (Published green /
  Draft gray), title, description (2-line clamp), response/views counts, relative
  "updated X ago", and a hover kebab menu: **Edit, Analytics, Responses,
  Duplicate, Copy link (published only), Archive/Unarchive, Delete**.
- Delete uses a **ConfirmModal** ("…and all its responses will be permanently
  removed"). Optimistic UI in `useForms`: remove/duplicate/favorite patch update
  the list immediately, roll back + toast on error.

### 9.5 Builder (the core feature, full-screen)
**Top bar:** back, logo, inline-editable form **title** (auto-hover highlight),
live **save indicator** (Saved ✓ / Saving… / Unsaved ⚠), Undo/Redo, Responses &
Analytics shortcuts, **Preview**, **Share** (disabled until published), and
**Publish/Unpublish** toggle.

**Layout:** left field palette | center canvas (max-w-2xl) | right Settings
panel. On mobile the build/design panels become tabs.

**Field palette** (`FieldPalette`): 18 field types grouped (Inputs/Choices/
Advanced/Layout), each **draggable** (`useDraggable`) and **click-to-add**.

**Canvas** (`SortableField`):
- **Drag & drop** reordering via `@dnd-kit` (`SortableContext` +
  `verticalListSortingStrategy`), 5px activation threshold, **DragOverlay**
  floating card preview with "New" badge when coming from the palette.
- Each field shows: drag handle, type icon, label (red `*` when required),
  type badge, hover **Duplicate/Delete** buttons, expand chevron for inline
  settings, and a **live (disabled) render** of the field via `FieldRenderer`.
- Drop-in-canvas highlight ring; full **EmptyState** when the form has no fields
  ("Add a field" / "Use AI").
- **Undo/redo** via `useHistoryState` (100-step history, cap), wired to `⌘Z`,
  `⌘⇧Z`/`⌘Y`, and `⌘P` for preview.
- **Debounced autosave** (800ms) with dirty/saving/saved states; first load
  suppresses the initial save.
- New-form flow: `/builder/new` calls `formApi.create()`, then **replaces the URL**
  to `/builder/:id` (keeps `?ai=1`), so refresh/back work.

**Field settings** (`FieldSettings`, inline expanded panel):
- Question label with **"AI improve"** (rewrite + suggested follow-up questions).
- Placeholder, Description, Options editor (add/remove rows) for choice types,
  Help text, **Required** switch.
- **Validation editor:** min/max length (text types) or min/max value (number),
  regex pattern, custom error message — plus **"AI suggest"** one-click validation
  rules per field type.

**Form settings** (`SettingsPanel`):
- **Theme picker:** 6 themes with live miniature preview thumbs (accent-tinted
  bauhaus art). Themes are primarily an accent + illustration motif choice.
- **Branding:** 12-color accent palette + native `<input type="color">` custom
  picker, logo URL, border-radius slider (0–28px).
- **Messages:** submit button text, thank-you message, progress bar switch.
- **SEO:** title + description.
- **AI insights:** "Analyze this form" → purpose, audience, estimated completion
  time, and improvement suggestions.

**AI generate modal** (`AIGenerateModal`): prompt textarea (⌘/Ctrl+Enter to
submit), 5 clickable example prompts, disabled-while-loading, animated
"Designing your form…" state, then replaces the whole form definition.

**Share modal** (`ShareModal`): public link (copy + open) and iframe **embed
code**; amber warning when not yet published.

### 9.6 Public fillable form (`/f/:slug`)
- **FormView:** clean light surface, split layout on desktop (form left, soft
  bauhaus SVG art panel right, tinted by the form's accent color). Supports
  custom logo, progress bar (answered/answerable, sticky), accent-driven
  gradients on the submit button.
- **FieldRenderer:** fully controlled renderer shared by builder + public view.
  Custom **accent-driven styling via CSS variables** (`--accent`,
  `--accent-ring`). Controls per type: styled radio cards, checkbox cards with
  animated checks, Yes/No segmented buttons, **5-star rating** with hover state,
  dashed file upload, custom select chevron, native date/number inputs. Error
  states + per-field required markers; on submit, invalid fields get error text
  and the first invalid field **scrolls into view**.
- **Success screen:** accent-colored check animation over a faint art-panel
  background, custom thank-you message.
- **SEO:** sets `document.title` from `settings.seoTitle`.
- **Not-found state** for unpublished/bad slugs.

### 9.7 Responses (per-form)
- **FormPageHeader** (shared with Analytics): back, title + status badge,
  response/views counts, **View** link (published), and tab nav (Edit /
  Responses / Analytics).
- **5 KPIs** (KpiCard): Responses, Views, Conversion (progress bar), Completion
  (progress bar), Avg. time (formatted "1m 30s").
- **Responses table:** debounced search, identity columns auto-detected (first
  `short_text` → name, first `email` → email, plus 2 extra answer columns),
  avatar + name/email cell, submitted date, completion time, hover reveal arrow
  + row delete. Skeleton page on load; contextual EmptyState.
- **Detail Drawer:** per-response meta tiles (submitted, completion, device
  parsed from UA), full Q&A list, "x of y answered" footer, Delete button.
- **Export CSV:** downloads `FormName_responses.csv` via Blob; disabled when no
  responses.

### 9.8 Analytics (per-form)
- KPI row with sparkline on Responses.
- **Bento grid:**
  - Response **timeline** — ComposedChart: daily area (teal gradient) +
    cumulative line (gold), dual Y axes, legend.
  - **Completion rate** — hand-rolled SVG **gauge** + mini stat tiles.
  - **Conversion funnel** — Views → Responses → Completed proportional bars with
    % drop-off chips.
  - **Devices** — donut chart (center total) + side legend.
  - **Busiest days** — vertical bars, peak bar highlighted gold.
- **Per-question breakdown** (`QuestionChart`): smart visualization — free-text
  questions show the last 5 sample answers; yes/no & small choice sets get a
  donut + % legend; rating/number/choice get horizontal gradient bars with
  auto-sized category axis. Rating questions show an amber average badge.
- Graceful "No analytics yet" empty state; loading skeletons.

### 9.9 Insights (global)
- **4 KPI cards** with week-over-week delta (▲/▼ % green/red).
- **Responses by time of day** — custom weekday×hour **heatmap** (SVG-free grid,
  hover tooltips, "Less→More" scale legend).
- **Response volume** — area chart with **Day/Week/Month** granularity bucket
  toggle.
- **Sessions by device** — donut + per-device list with icons & %.
- **Top forms leaderboard** — ranked rows with progress bars, conversion, click →
  per-form analytics.

### 9.10 Inbox
- Per-form **filter chips** (color-dotted, up to 6 forms) + debounced search.
- **Feed** of recent responses: avatar (tinted to the source form's color),
  respondent name, source-form Badge, snippet preview, relative time; hover lift.
- Detail **Drawer** with meta tiles + answers + "Open in form" footer button.
- Empty/skeleton states.

### 9.11 Templates
- **8 curated templates** (feedback, employee, restaurant, course, conference,
  job, support, lead) defined in `lib/templates.js` as `build()` factories using
  the real `createField()`.
- Category filter chips (All/Feedback/HR/Education/Events/Marketing), grid of
  **TemplatePreview** mini form thumbnails (faux fields rendered per type,
  mono-scheme with teal accent), icon, question count, hover-gradient "Use
  template" → creates the form and jumps into the Builder.
- "Generate with AI" shortcut button.

### 9.12 Settings
- **Profile:** name + avatar-color swatch picker, save disabled until dirty.
- **Appearance:** Light/Dark theme cards.
- **Password:** current + new (validation-gated).
- **Danger zone:** red-bordered Delete Account card → ConfirmModal → logout.
- (Mock: `changePassword`/`deleteAccount` always succeed.)

---

## 10. State management & hooks

| Hook | Purpose |
| --- | --- |
| `AuthContext` + `useAuth` | user/session, login/register/logout, token persistence, session restore on mount, `updateUser` merge |
| `ThemeContext` + `useTheme` | dark/light + persistence + system default |
| `useForms` | forms list CRUD with **optimistic updates** + rollback |
| `useHistoryState` | undo/redo state container (100-step cap), `set/reset/undo/redo` |
| `useDebounce` | generic debouncer (300–800ms) |

There is **no global data-fetching library** (no React Query/SWR). Pages own their
`useState` + `useEffect` fetches and pass data down. The Builder uses
`useHistoryState` for the whole form document, giving undo/redo across every
edit.

---

## 11. AI features (all mocked)

| Entry point | What it returns |
| --- | --- |
| "Generate with AI" (builder/palette/dashboard/templates) | Full form draft: title, description, theme, typed questions with options |
| "AI improve" question | Rewritten label + clarity note + follow-up question suggestions |
| "AI suggest" validation | Per-type validation rules (regex for email/phone, min/max for number/text) |
| "Analyze this form" | Purpose, audience, completion-time estimate, 3 suggestions |
| `aiApi.formSummary` | Structured summary block in SettingsPanel |

All are wrapped in `slow()` latency so the "generating…" states are real.

---

## 12. "DB schema" (implied backend contract)

No database exists in this boilerplate, but the REAL API block in
`services/index.js` + `mockData.js` fully specifies the contract:

```
authApi    POST /auth/register  → { data: { user, token } }
           POST /auth/login     → { data: { user, token } }
           GET  /auth/me        → { data: { user } }
           PUT  /auth/profile   → { data: { user } }
           PUT  /auth/password  → { data: { success, message } }
           DELETE /auth/me      → { data: { success, message } }

formApi    GET    /forms?search&filter            → { data: { forms } }
           GET    /forms/:id                      → { data: { form } }
           GET    /public/forms/:slug             → { data: { form } }
           POST   /forms                          → { data: { form } }
           PUT    /forms/:id                      → { data: { form } }
           POST   /forms/:id/publish { publish }  → { data: { form } }
           POST   /forms/:id/duplicate            → { data: { form } }
           DELETE /forms/:id                      → { data: {...} }

responseApi POST   /public/forms/:slug/respond    → { data: {...} }
           GET    /forms/:id/responses?search     → { data: { responses, count } }
           GET    /forms/:id/analytics            → { data: { analytics } }
           DELETE /responses/:id                  → { data: {...} }
           GET    /forms/:id/responses/export     → text/csv

insightsApi GET /insights                         → { data: { insights } }
           GET /inbox?search                      → { data: { responses } }

aiApi      POST /ai/generate-form                 → { data: { form } }
           POST /ai/generate-validation           → { data: { validation } }
           POST /ai/improve-question              → { data: { result } }
           POST /ai/form-summary                  → { data: { summary } }
```

API responses are unwrapped one level: `api.get(...).then(r => r.data.data.X)`.

---

## 13. Ponytail observations (lazy-senior review)

The codebase is already lean and consistent; the flags below are minor:

**Dead weight (safe to delete at go-live or now):**
- `axios` is a dependency but **never imported** in mock mode (only inside the
  commented REAL block). Keep it only if the REAL block stays the plan — it does.
- `mockData.js` and the MOCK blocks are throwaway by design (documented).
- `lib/api.js` MOCK `export default null` — fine.

**Potential over-engineering (YAGNI flags):**
- `useHistoryState` caps history at 100 and stores **full form snapshots** per
  keystroke-bound action; a shallow diff/command pattern would be lighter, but at
  demo scale (≤ dozens of fields) the copy cost is negligible — **leave it**.
- `shade()`, `hexToRgba()`, `deviceFromUA()`, and `shortUA()` (Responses) are
  three near-duplicate UA parsers (`Responses.shortUA`, `Inbox.device`,
  `charts.deviceFromUA`). All three could collapse to one helper in `lib/charts.js`
  — a ~15-line diff. **Worth doing**, one location instead of three.
- `KpiCard` keeps "legacy aliases" (`amber`, `pink`, `violet`) that just map to
  slate/gold. Unused-ish; one accent map would do.
- `StatCard` (ui/Card.jsx) vs `KpiCard` (analytics/) overlap heavily — two KPI
  card implementations. Merge into one.
- `AuthContext` and `ThemeContext` are each tiny; fine as-is. No router-based
  state, no store — appropriate for this size.
- The dashboard's "AI Generator" NavCard + a separate Templates card + an AI
  button in three more places is marketing repetition, not tech debt.

**Genuinely good (no changes):**
- Mock/real parity via a single service seam — the whole boilerplate premise,
  executed cleanly.
- Accent-driven styling through CSS variables (`FieldRenderer`) avoids dozens of
  theme-branch classes.
- Deterministic PRNG for the art panels (no flicker between renders).
- Optimistic mutations with rollback in `useForms`.

---

## 14. How to run

```bash
npm install
npm run dev        # http://localhost:5173 — click "Fill demo credentials"
npm run lint       # oxlint (react/rules-of-hooks, only-export-components)
npm run build      # production build
```

To go live: uncomment REAL blocks in `src/services/index.js` and `src/lib/api.js`,
delete `mockData.js`, set `VITE_API_URL` in `.env`. No component edits required.

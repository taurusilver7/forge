# Architecture Context

## Stack

| Layer       | Technology                              | Role                                    |
| ----------- | --------------------------------------- | --------------------------------------- |
| Framework   | Next.js 16 + TypeScript 5 + Turbopack   | Full-stack app with server/client edges |
| UI          | Tailwind CSS v3 + shadcn/ui             | Component composition and styling       |
| Auth        | Clerk v7                                | User identity and route protection      |
| Database    | Prisma ORM + PostgreSQL                 | Type-safe ORM with migrations           |
| Forms       | React Hook Form + Zod                   | Form state + validation                 |
| Drag & drop | @dnd-kit/core                           | Builder canvas drag-and-drop            |
| Icons       | @radix-ui/react-icons + lucide-react    | Icon system                             |

## System Boundaries

- `actions/form.ts` — Server Actions: auth + DB operations. No `"use client"`.
- `app/*/page.tsx` — Server Components: auth check, data fetch, render.
- `app/*/_components/` — Client Components: interactive UI, DnD, forms.
- `components/fields/` — Field type implementations (designer, form, properties, validate).
- `components/context/` — React context providers (DesignerContext).
- `components/form-elements.tsx` — Element type system + registry.
- `lib/` — Shared utilities (Prisma client, id generator, condition helpers).
- `prisma/schema.prisma` — Database models.
- `components/ui/` — shadcn/ui primitives (do not modify generated files).

## Storage Model

- **Database (PostgreSQL via Prisma):** Forms (`Form` table) and submissions
  (`FormSubmission` table). Form element data stored as serialized JSON in
  `Form.content`. Submission data stored as serialized JSON in
  `FormSubmission.content`.
- **No blob/file storage:** All form data is text-based JSON in the database.
- **No caching layer:** Each page load queries the database directly.
  (Phase 3+ may add Redis for analytics counters.)

### Prisma Schema

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
}

model FormSubmission {
  id        String   @id @default(uuid())
  formId    String
  form      Form     @relation(fields: [formId], references: [id])
  content   String
  createdAt DateTime @default(now())
}
```

## Auth Model

- Clerk handles authentication. `proxy.ts` protects all routes except
  `/sign-in`, `/sign-up`, and `/submit/*`.
- Every server action calls `auth()` and redirects to `/sign-in` if no userId.
- Public form submission (`/submit/[formUrl]`) has no auth check.
- No middleware-level auth — file named `proxy.ts` with `createRouteMatcher` (Next.js 16 convention).

## State Management

- **DesignerContext** (`components/context/designer-context.tsx`): Central state
  for the builder — elements array, selected element ID, CRUD operations.
  Uses `useState` + `useCallback` (no useReducer — simple enough).
- **No global state library**: Context is sufficient for single-builder scope.
  (Documented ceiling: migrate to Zustand if context re-render cascade becomes
  measurable.)
- **Form submit state**: Local `useRef` + `useState` in `FormSubmit` component.
- **Auto-save** (Phase 2): Local `useEffect` with 2s debounce in `FormBuilder`.

## DnD Model

- Three distinct drag scenarios handled by `useDndMonitor` in `Designer`:
  1. Sidebar element → empty drop zone (append to end)
  2. Sidebar element → over existing element (insert at position)
  3. Designer element → over another designer element (reorder)
- Sensors: `MouseSensor` (10px activation) + `TouchSensor` (300ms delay, 5px tolerance).
- Each `DesignerElementWrapper` creates top/bottom droppable halves for precise insertion.
- `DragOverlay` renders element preview during drag.

## Invariants

1. Server Actions handle all mutations. Client components only read from context.
2. Auth checked at top of every Server Action before any DB operation.
3. Element IDs generated client-side via `crypto.randomUUID()`.
4. `Form.content` is always valid JSON string — default `"[]"`.
5. Each field type implements all 4 slots (designer, form, properties, validate).
6. `extraAttributes` always spread in `construct()` to prevent shared references.
7. Public form endpoint (`GetFormContentByUrl`) filters `published: true`.
8. Form submissions increment the `submissions` counter on the Form record.
9. Theme variables defined in `globals.css`, used via Tailwind tokens only.
10. All icons from `@radix-ui/react-icons` — no `react-icons`.

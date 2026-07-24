# Code Standards

## General
- Keep modules small and single-purpose. Fix root causes, do not layer workarounds.
- Prefer deletion over addition. Boring over clever.
- Mark intentional simplifications with `ponytail:` comment naming the ceiling.

## TypeScript
- Strict mode required. Avoid `any` — use typed `extraAttributes` extensions.
- Use `interface` for object contracts (e.g., `FormElement`), `type` for unions (e.g., `ElementType`).
- Infer types from Zod schemas with `z.infer<typeof schema>`.

## Next.js
- Server Components for data fetching. Add `"use client"` only when using hooks or browser APIs.
- Server Actions in `actions/` files — thin wrappers around DB calls.
- Pages that require auth: check `auth()` from Clerk, redirect to `/sign-in` if missing.
- Public pages (`/submit/[formUrl]`): no auth check, no user context.

## Styling
- Use CSS custom property tokens from `globals.css` — no hardcoded hex values.
- Reference tokens via Tailwind: `bg-background`, `text-foreground`, `border-border`.
- Use `cn()` utility for conditional class merging.

## Server Actions
- One action file per domain (`actions/form.ts` for all form operations).
- Each function starts with `auth()` → redirect if no userId.
- Wrap in try/catch, return structured data or throw on error.
- Use `updateMany` with `{ where: { id, userId } }` for ownership checks + update in one query.

## File Organization

```
actions/                  — Server Actions
  form.ts                 —   GetFormStats, CreateForm, GetForms, GetFormById,
                              UpdateFormContent, PublishForm, GetFormWithSubmissions,
                              GetFormContentByUrl, SubmitForm
app/                      — Next.js App Router pages
  (dashboard)/            —   Protected routes group
    builder/[id]/         —     Form builder page
    form/[id]/            —     Form details + submissions
    page.tsx              —     Dashboard
  submit/[formUrl]/       —   Public form submission
  layout.tsx              —   Root layout (ClerkProvider, ThemeProvider, Toaster)
components/               — Shared UI components
  context/                —   React context providers (DesignerContext)
  fields/                 —   Field type implementations (text-field.tsx, etc.)
  ui/                     —   shadcn/ui primitives (do not modify)
  form-elements.tsx       —   Element type registry
  form-elements.tsx       —   Element type + interface definitions
  form-submit.tsx         —   Public form renderer
  form-cards.tsx          —   Dashboard form grid
  create-form-btn.tsx     —   New form dialog
  sidebar-element.tsx     —   Draggable sidebar buttons
  property-sidebar.tsx    —   Properties panel wrapper
lib/                      — Utilities
  id-generator.ts         —   crypto.randomUUID()
  utils.ts                —   cn()
  prisma.ts               —   Prisma client singleton
prisma/                   — ORM
  schema.prisma           —   DB models
```

## Form Element Pattern

Each field type lives in `components/fields/[name].tsx` and exports a `FormElement`
object with these slots:

```ts
{
  type: ElementType,
  construct: (id: string) => FormElementInstance,
  designerBtnElement: { icon: IconType, label: string },
  designerComponent: React.ComponentType<{ elementInstance }>,
  formComponent: React.ComponentType<{ elementInstance, submitValue?, isInvalid?, defaultValue? }>,
  propertiesComponent: React.ComponentType<{ elementInstance }>,
  validate: (element, currentValue) => boolean,
}
```

- `extraAttributes` includes `condition?: Condition` (Phase 1) and `pageId?: string` (Phase 3).
- `construct()` must spread `{ ...extraAttributes }` to prevent shared reference mutation.
- Properties panel uses React Hook Form + Zod for each field type.
- `formComponent` handles validation on blur, calls `submitValue(id, value)`.

## Naming Conventions
- Files: kebab-case (`text-field.tsx`).
- Components: PascalCase (`TextFieldFormElement`).
- Functions: camelCase (`updateElement`, `removeElement`).
- Server actions: PascalCase (`GetFormStats`, `CreateForm`).
- DB models: PascalCase (`Form`, `FormSubmission`).

## Error Handling
- Server actions: throw on failure, caught in client component try/catch → toast.
- Public form validation: per-field `validate()` returns boolean, error state per field.
- No error boundaries needed beyond Next.js default `error.tsx`.
- Do not leak DB errors to users — wrap Prisma operations and return generic messages.

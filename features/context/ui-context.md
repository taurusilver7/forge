# UI Context

## Theme

Default shadcn/ui theme (Neutral). Light mode and dark mode via `next-themes`.
All values are CSS custom properties in `globals.css`. Components use Tailwind
tokens only — no hardcoded hex values.

### Light Theme

| Role              | CSS Variable            | Value        |
| ----------------- | ----------------------- | ------------ |
| Page background   | `--background`          | `#ffffff`    |
| Card surface      | `--card`                | `#ffffff`    |
| Primary text      | `--foreground`          | `#0a0a0a`    |
| Primary accent    | `--primary`             | `#171717`    |
| Muted bg          | `--muted`               | `#f5f5f5`    |
| Muted text        | `--muted-foreground`    | `#737373`    |
| Accent bg         | `--accent`              | `#f5f5f5`    |
| Border            | `--border`              | `#e5e5e5`    |
| Input             | `--input`               | `#e5e5e5`    |
| Ring/focus        | `--ring`                | `#0a0a0a`    |
| Secondary         | `--secondary`           | `#f5f5f5`    |

### Dark Theme

| Role              | CSS Variable            | Value        |
| ----------------- | ----------------------- | ------------ |
| Page background   | `--background`          | `#0a0a0a`    |
| Card surface      | `--card`                | `#0a0a0a`    |
| Primary text      | `--foreground`          | `#fafafa`    |
| Primary accent    | `--primary`             | `#fafafa`    |
| Muted bg          | `--muted`               | `#262626`    |
| Muted text        | `--muted-foreground`    | `#a3a3a3`    |
| Accent bg         | `--accent`              | `#262626`    |
| Border            | `--border`              | `#404040`    |
| Input             | `--input`               | `#404040`    |
| Ring/focus        | `--ring`                | `#d4d4d4`    |
| Secondary         | `--secondary`           | `#262626`    |

## Typography
- UI text: `--font-sans` — Inter, ui-sans-serif, system-ui.
- Code/mono: `--font-mono` — ui-monospace stack.
- Applied via `@layer base` on `body`.

## Spacing & Radius
- Base: 4px (Tailwind default).
- Border radius: `rounded-lg` (8px) for cards/buttons, `rounded-md` (6px) for small elements.
- Theme radius variable: `--radius: 0.5rem`.

## App Shell (Dashboard Layout)
- Top nav: `h-16`, sticky, `border-b border-border`, flex between logo and user area.
- Main content: `flex w-full flex-grow`, `bg-background`.
- Pages use flex column layout with min-height screen.

## Form Builder Canvas
- Full-height DnD workspace with `bg-accent`, `bg-[url(/paper.svg)]` texture.
- Canvas: `max-w-5xl mx-auto`, `bg-background`, `rounded-xl`, vertical scroll.
- Drop zone: `ring-3 ring-primary ring-inset` when hovered.
- Element wrappers: `h-32`, `ring-1 ring-accent ring-inset`, hover cursor pointer.
- Selected element: `ring-2 ring-primary`.
- Drag overlay: `opacity-80`, `pointer-events-none`, matching canvas styling.

## Drag & Drop
- Drag handle covers left 80%+ of element wrapper on hover.
- Top/bottom half droppable indicators: `h-1 bg-primary` line.
- Sidebar elements: draggable buttons with `useDraggable`, cursor grab.
- Drag overlay shows element preview during drag.

## Sidebar (Builder)
- Context-aware: switches between element palette and properties panel.
- Element palette: grid of field type buttons with icons + labels.
- Properties panel: `w-[350px]` sidebar, form fields with labels and controls.
- Active panel slides in on element selection, slides out on deselect.

## Properties Panel
- React Hook Form + Zod schema per field type.
- Common fields: label, placeholder, helperText, required (switch).
- Type-specific fields: options list (Select), rows (TextArea), height (Spacer).
- Save on blur or explicit submit button depending on field type.
- (Phase 1) Condition editor section at bottom.

## Form Submission (Public)
- Centered card layout, `max-w-2xl`, `border`, `shadow-xl shadow-purple-700`.
- Each field renders vertically with label, input, and error state.
- Submit button at bottom with loading spinner state.
- (Phase 3) Multi-step: progress bar at top, Next/Back buttons.
- Submitted state: centered "Form submitted" thank-you message.

## Empty States
- Builder empty canvas: centered "Drop here" text (text-3xl, font-bold, muted).
- Dashboard empty: only "Create new form" button visible.
- (Phase 4) Templates grid in create dialog.

## Dialog & Modal Patterns
- Centered overlay, `rounded-lg`, card background. Uses shadcn `Dialog`.
- Full-screen preview dialog for testing form.
- Confirmation dialog for publish action.

## Icons
- `@radix-ui/react-icons` for all UI icons (small, consistent set).
- `lucide-react` only for spinners (`Loader2`) and field-specific icons.
- Sizes: `h-4 w-4` inline, `h-6 w-6` buttons, `h-8 w-8` field type icons.
- No `react-icons` — removed in favor of radix icons + lucide.

## Toast Notifications
- shadcn `Toaster` at root layout.
- Used for: save success/error, publish success/error, copy link confirmation.
- Positioned at top-right by default.

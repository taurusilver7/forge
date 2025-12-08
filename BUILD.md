## Forge — (Builder & Designer)

-  This document describes the project purpose and provides a concise, technical guide to set up and run the application locally with a focus on the form builder (Designer)
   and the Designer Sidebar features developed so far.
-  Keep this file short and actionable — intended for a developer getting up to speed on the builder features.

---

### Purpose

-  Forge is a visual form builder. The Builder UI allows drag-and-drop creation of form templates using a set of reusable form elements (TextField, NumberField, etc.).

-  The Designer is the canvas where instances of FormElements are arranged, selected, and edited. The Sidebar provides draggable form elements (Designer buttons) and
   a properties panel to configure selected elements.

---

### Project structure (relevant to the builder)

-  `app/(dashboard)/builder/[id]/_components/`

-  `form-builder.tsx` — top-level component for the builder page; wraps content in `DndContext`
-  `designer.tsx` — the Designer canvas (drop zone, element rendering, selection)
-  `_components/designer-sidebar.tsx` — sidebar that lists draggable element buttons
-  `_components/drag-overlay.tsx` — shows visual ghost during drag operations
-  `_components/form-builder.tsx` — orchestration and header actions (save/publish/preview)

-  `components/form-elements.tsx` — registry + types for form elements. Each FormElement exposes:

-  `designerBtnElement` (icon + label for the sidebar)
-  `designerComponent` (read-only preview shown on the canvas)
-  `propertiesComponent` (properties panel to add attributes to the elements shown on the canvas)
-  `formComponent` (Fully customized form-elements shown in the preview)

### Quick summary

-  Forge is a visual form-builder: drag elements from the Designer Sidebar onto the canvas, configure them via
   a properties panel. Preview the end-results and publish runtime forms.

---

### Must-have environment (local development)

-  Node.js 18+ and `npm` (or `pnpm`/`yarn`)
-  Local `.env` with at minimum:
   -  `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (auth)
   -  `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` (database)

Keep secrets out of source control.

---

### One-time setup

```cmd
npm install
npx prisma generate
```

If you need to initialize prisma for the first time:

```cmd
npx prisma init
npx prisma migrate dev --name init
```

---

### Common developer commands

-  Start dev server:

```cmd
npm run dev
```

-  Build and run production locally:

```cmd
npm run build
npm start
```

-  Prisma tooling:

```cmd
npx prisma studio          # view DB
npx prisma migrate dev     # create migration and apply
npx prisma generate        # regenerate client after schema changes
```

---

### Key files & folders (builder-focused)

-  `app/(dashboard)/builder/[id]/_components/`

   -  `form-builder.tsx`: top-level builder page; supplies `DndContext` and overlay
   -  `designer.tsx`: canvas, dropzone, elements rendering, `useDndMonitor` handling
   -  `designer-sidebar.tsx`: draggable element buttons (sidebar)
   -  `drag-overlay.tsx`: render ghost preview during drag

-  `components/form-elements.tsx`: central registry and types for form elements
-  `components/context/designer-context.tsx`: shared state (`elements`, selection, add/remove/update)

---

### Implementation notes (concise decisions on previous lines)

-  Clerk & Auth: keep `ClerkProvider` at root layout; ensure redirect paths are set in env when customizing sign-in/up pages.
-  UI library: shadcn-ui is configured; ThemeProvider wraps app for dark/light themes. Implement a visible `ThemeSwitcher` component.
-  Prisma: prefer `POSTGRES_PRISMA_URL` for runtime (pooled) and `POSTGRES_URL_NON_POOLING` for migrations locally.

---

### Builder flows (how code maps to behavior)

1. Drag & drop from Sidebar → Designer

   -  Sidebar buttons include dnd metadata: `isDesignerBtnElement` + `type`.
   -  `DragOverlayWrapper` renders a preview during drag via `useDndMonitor`.
   -  `Designer` `onDragEnd` creates a new FormElementInstance and calls `addElement(index, newElement)`.

2. Reorder existing elements

   -  Each designer element is both draggable and droppable. Use top/bottom droppable zones to compute insertion index.
   -  On drag end, remove the active element and insert at new index.

3. Select → Properties → Update

   -  Click sets `selectedElement` in `DesignerContext`.
   -  The properties panel renders the element's `propertiesComponent` which uses React Hook Form + Zod.
   -  `updateElement(id, element)` persists changes back to context.

---

### Debug tips and gotchas

-  Pointer events: attaching dnd-kit listeners to the whole element wrapper can block children clicks. Use a narrow drag-handle.
-  While dragging, use `isDragging` to avoid duplicate render of the original element.
-  If `removeElement` or context methods appear not to fire, confirm the provider wraps the component tree and that hooks use the correct context.

---

### How to add an element (concise)

1. Create `components/fields/<your-field>.tsx` and export a `FormElement` object with the required fields:
   -  `type`, `construct(id)`, `designerBtnElement`, `designerComponent`, `formComponent`, `propertiesComponent`, `validate`.
2. Register in `components/form-elements.tsx`.
3. Add UI in the sidebar mapping if needed.

---

### Drag&Drop features/scenario

-  Drag & Drop for Sidebar-Element (Text, Number) to dropzone area.
-  Drag & Drop a Sidebar Element over a Design-Element (Already in the dropzone)
-  Drag&Drop a Designer Element over another Designer-Element in the dropzone.

## FormElements design positions

-  Each Object in FormElement instance are displayed/parsed at specific positions during development

-  `designerBtnElement` is parsed in the `FormElementSidebar` to represent the btn-format of the form-element for drag&drop.
-  `designerComponent` is parsed in the desginer-dropzone for primary element manipulation (customize, position)
-  `propertiesComponent` is parsed in the `PropertyFormSidebar` afer a form-element is placed in the designer-dropzone. It added properties/attributes to the form-element
-  `formComponent` is parsed in the `Preview` view to display the end result after design & property evaluation.

## Form Functions (Preview, Save & Publish)

-  The Preview opens a dialog to parse the FormComponent of the stacked form-elements in the designer-dropzone.
-  The Save button fires a server action to update the form contents in the database. Use use-transition hook to trigger the save.
   Create a persistant state for the saved form elements in the design context with a useEffect hook in form-builder. Avoid render delay with a state.
-  Publish button opens a alert-dialog to fire a server action to publish the form to public. A published form cannot be modified further. Render UI based on the published form status.

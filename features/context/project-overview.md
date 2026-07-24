# Forge

## Overview

Forge is a form builder SaaS that lets users create, publish, and manage forms with
a drag-and-drop builder. Built with Next.js 16, React 19, Prisma, PostgreSQL, and
shadcn/ui. Provides a type-safe element system, dual validation (Zod + Prisma),
and public form submission.

## Goals

1. Provide an intuitive drag-and-drop form builder with real-time canvas feedback.
2. Support 14+ field types via a modular, type-safe element registry.
3. Enable form publishing with shareable URLs and submission collection.
4. Offer basic analytics (visits, submissions, rates) per form.
5. Maintain a clean, responsive UI with dark/light theme support.
6. Keep the codebase lean — minimal deps, no speculative abstraction.

## Core User Flow

1. User signs in via Clerk (sign-in/sign-up routes).
2. User lands on dashboard showing stat cards + form grid.
3. User clicks "Create new form" → dialog with name/description → enters builder.
4. Builder loads saved elements (or empty canvas). User drags fields from sidebar.
5. User clicks a field → properties panel opens on right for editing.
6. User saves manually (Phase 2 adds auto-save with debounce).
7. User publishes form → confetti + share link → form is live at `/submit/[shareURL]`.
8. Submitters fill and submit the form → data stored as FormSubmission records.
9. User views form details → stats cards, submissions table, CSV export.
10. (Future) Conditional logic, multi-page, templates, analytics drop-off tracking.

## Features

### Form Builder
- Drag-and-drop canvas with 3 DnD scenarios (sidebar→canvas, sidebar→element, element→element)
- 14 field types: Text, Number, TextArea, Date, Checkbox, Select, Email, Phone, Rating, Slider + layout elements (Title, Subtitle, Paragraph, Separator, Spacer)
- Real-time properties panel per field type
- Manual save / publish (Phase 2: auto-save with debounce)
- Published state shows confetti + share link + copy button
- (Phase 1) Conditional logic — visibility rules per field
- (Phase 3) Multi-page forms with step-by-step navigation

### Dashboard
- Stat cards: total visits, submissions, submission rate, bounce rate
- Form grid: draft/published badges, edit/view links, relative creation time
- "Create new form" dialog

### Form Details / Analytics
- Per-form stats (visits, submissions, rates)
- Submissions table with per-field rendering (date badges, checkboxes)
- CSV export (native Blob, no xlsx dep)
- (Phase 5) Drop-off tracking per page

### Authentication
- Clerk auth with proxy.ts route protection
- Protected dashboard, builder, and form details
- Public form submission pages (no auth required)

### Public Form Submission
- Server-rendered form from `content` JSON
- Per-field validation via Zod-based schemas
- Submission stored as FormSubmission record with JSON content

## Scope

### In Scope
- Form CRUD (create, read, update, publish)
- Drag-and-drop builder with 14 field types
- Field properties editing per type
- Form publishing + share URLs
- Submission collection and storage
- Dashboard with aggregate stats
- Form details with submissions table + CSV export
- Public form rendering and validation
- (Phase 1) Conditional logic
- (Phase 2) Auto-save with debounce + undo/redo
- (Phase 3) Multi-page forms
- (Phase 4) Static form templates
- (Phase 5) Basic analytics / drop-off tracking
- (Phase 6) Embed iframe + QR code sharing

### Out Of Scope
- AI form generation (Phase 4 deferred)
- Payment integration (Stripe)
- Team collaboration / workspaces
- Custom domains / branding removal
- REST API / webhooks
- File upload fields
- Email notifications
- Third-party integrations (Zapier, Google Sheets)

## Success Criteria

1. Signed-in user can create, edit, publish, and view forms.
2. Builder loads saved elements correctly.
3. Drag-and-drop works for all 3 DnD scenarios without visual glitches.
4. Each field type renders correctly in designer, form, and properties modes.
5. Published form is accessible at share URL and accepts submissions.
6. Dashboard reflects correct aggregate stats.
7. Form details page shows submissions and allows CSV export.
8. Build passes with zero errors (`npm run build`).

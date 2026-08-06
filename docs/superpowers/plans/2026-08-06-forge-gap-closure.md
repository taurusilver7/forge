# Forge Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the highest-effort-impact gaps from ANALYSIS.md (Timely Forms AI) against the Forge form-builder, excluding all AI features. Scope: (1) RFC4180 CSV export, (2) Forms browser with search/filter/favorite/kebab menu, (3) submissions search + detail dialog + row delete, (4) builder UX (inline title, real save indicator, duplicate element, live-apply properties, history cap), (5) per-form analytics + global insights, (7) inbox, (8) branding accent/logo + YesNo + File fields.

**Architecture:** Additive + surgical. Pure logic (`lib/csv.ts`) is dependency-free and validated by a Node type-stripping self-check (`node --experimental-strip-types`, verified working on this machine, Node v22.14.0). Server mutations extend the existing server-action pattern in `actions/form.ts` — no new dependencies. UI follows the existing server-fetch → thin client-render pattern already used by `form-cards.tsx` and `client-table.tsx`. Charts are hand-rolled flex bars in `lib/charts.tsx` — no chart library (YAGNI at this scale; the report's own gauge/heatmap are hand-rolled too). New fields follow the exact `FormElement` registry contract in `components/form-elements.tsx`.

**Tech Stack:** Next.js 16 App Router, Prisma/Postgres, shadcn/ui + Radix primitives, Tailwind, zod, React Hook Form (builder only), date-fns, lucide + radix icons. Node ≥ 22.6 for the self-check.

## Global Constraints

- **No new npm dependencies.** Reuse existing libs only.
- **No `any` in new/changed code.** Field files already narrow `extraAttributes` via a local `CustomInstance` type — keep that pattern.
- **No prop-drilling.** Components that need shared data consume it from `useDesigner()` (builder) or receive props exactly one level down from a server component.
- **Follow existing patterns:** server actions in `actions/form.ts`; ui imports from `@/components/ui/*`; `cn()` from `@/lib/utils`; toasts via `toast({ title, description, variant })` from `@/components/ui/use-toast`.
- **Migrations** are applied with `npm run database` (`prisma db push`, regenerates the client). Dev database — no migration files.
- **Verification gates per task:** `npm run lint` and `npm run build` must pass. Pure-logic modules carry a `scripts/check-*.mjs` self-check run with `node --experimental-strip-types`.
- **Commit per task.**
- `FormElementInstance` shape: `{ id, type, extraAttributes? }`. Static types (`TitleField`, `SubTitleField`, `ParagraphField`, `SeparatorField`, `SpacerField`) store no answer.
- Submission `content` is a JSON string map `{ [fieldId]: string }` plus internal keys starting with `_` (`_lastPageReached`). Internal keys must always be filtered out of user-facing output.
- **Share/embed:** already exists — `FormLinkShare` (link + iframe + QR) and the post-publish screen. No new share work in this plan.

---

## Task 1: RFC4180 CSV export + submission IDs

**Files:**
- Create: `lib/csv.ts`
- Create: `scripts/check-csv.mjs`
- Modify: `app/(dashboard)/form/[id]/_components/submission-table.tsx`
- Modify: `app/(dashboard)/form/[id]/_components/client-table.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `toCsv(rows: CsvCell[][]): string` exported from `@/lib/csv`. `Row` in `submission-table.tsx` now carries `id: string` (submission DB id). `client-table.tsx` downloads CSV via `toCsv` with an `ID` first column.

### Why
The current export is `headers.join(",")` / `row.join(",")` (`client-table.tsx:49`) — a value containing a comma, quote, or newline silently corrupts every row and its columns. Fix at the single choke point.

- [ ] **Step 1: Create `lib/csv.ts`**

```ts
export type CsvCell = string | number | boolean | null | undefined;

export function toCsv(rows: CsvCell[][]): string {
	const escape = (value: string): string =>
		/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
	return rows
		.map((row) => row.map((cell) => escape(String(cell ?? ""))).join(","))
		.join("\r\n");
}
```

- [ ] **Step 2: Create `scripts/check-csv.mjs`**

```js
import { toCsv } from "../lib/csv.ts";
import assert from "node:assert";

const out = toCsv([
	["a", 'b"c', "d,e", "f\nnewline", null, 42],
	["plain", "", "x", "y", false, ""],
]);

const [l0, l1] = out.split("\r\n");
assert.strictEqual(l0, 'a,"b""c","d,e","f\nnewline",,42');
assert.strictEqual(l1, "plain,,x,y,false,");
console.log("csv check passed");
```

- [ ] **Step 3: Run the self-check**

Run: `node --experimental-strip-types scripts/check-csv.mjs`
Expected: `csv check passed` (a Node experimental warning on stderr is fine).

Covered edges: embedded comma, embedded double-quote (doubled), embedded `\n` (kept inside quotes, rows split only on `\r\n`), `null`→empty cell, number, boolean, empty string.

- [ ] **Step 4: Modify `app/(dashboard)/form/[id]/_components/submission-table.tsx`**

Change the `Row` type to include the submission id, and populate it:

```ts
type Row = { [key: string]: string } & {
	id: string;
	submittedAt: Date;
	_fields: number;
	_lastPage: number | null;
};
```

In the `form.FormSubmission.forEach` loop, add `id: submission.id,` to the pushed row (before `...content`):

```ts
		rows.push({
			...content,
			id: submission.id,
			submittedAt: submission.createdAt,
			_fields: fields,
			_lastPage: lastPage,
		});
```

- [ ] **Step 5: Modify `app/(dashboard)/form/[id]/_components/client-table.tsx`**

Add the import:

```ts
import { toCsv } from "@/lib/csv";
```

Replace the whole `downloadCSV` function:

```ts
	function downloadCSV() {
		const hasPages = rows.some((r) => r._lastPage !== null);
		const headers = [
			"ID",
			...columns.map((c) => c.label),
			"Fields",
			...(hasPages ? ["Last Page"] : []),
			"Submitted At",
		];
		const data = rows.map((row) => [
			row.id,
			...columns.map((col) => row[col.id] ?? ""),
			String(row._fields),
			...(hasPages ? [row._lastPage !== null ? String(row._lastPage) : ""] : []),
			new Date(row.submittedAt).toISOString(),
		]);
		const csv = toCsv(data);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${formName.replace(/\s+/g, "_")}_submissions.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
```

- [ ] **Step 6: Verify**

Run: `npm run lint`
Expected: no errors. (`next lint` lints JS/TS; `scripts/check-csv.mjs` is plain JS, trivially clean.)

Run: `npm run build`
Expected: succeeds (the `.mjs` is not part of the Next build graph).

Manual: publish a form whose answers contain a comma (`"a,b"`) and a quote; export CSV; open in Excel/Numbers — each answer lands in exactly one cell.

- [ ] **Step 7: Commit**

```bash
git add lib/csv.ts scripts/check-csv.mjs "app/(dashboard)/form/[id]/_components/submission-table.tsx" "app/(dashboard)/form/[id]/_components/client-table.tsx"
git commit -m "fix: RFC4180 CSV export with submission IDs"
```

---

## Task 2: History cap (100)

**Files:**
- Modify: `components/context/designer-context.tsx`

**Interfaces:**
- Consumes: existing `history` / `historyIndex` state.
- Produces: unchanged API. `undo`/`redo` behave identically; memory is bounded.

### Why
`pushHistory` (`designer-context.tsx:42`) stores a full `elements` snapshot on every mutation with no cap — unbounded growth during a long editing session. The report's own app caps at 100. Cap while preserving the exact existing index semantics.

- [ ] **Step 1: Add the constant and replace `pushHistory`**

In `components/context/designer-context.tsx`, above the `pushHistory` callback:

```ts
	const HISTORY_LIMIT = 100;
```

Replace the existing `pushHistory` body with:

```ts
	const pushHistory = useCallback((prevElements: FormElementInstance[]) => {
		setHistory((h) => {
			const next = [...h.slice(0, historyIndex + 1), prevElements];
			return next.length > HISTORY_LIMIT
				? next.slice(next.length - HISTORY_LIMIT)
				: next;
		});
		setHistoryIndex((i) =>
			i + 1 > HISTORY_LIMIT - 1 ? HISTORY_LIMIT - 1 : i + 1,
		);
	}, [historyIndex]);
```

### Why this math is correct
Invariant after every `pushHistory`: `historyIndex === history.length - 1` (pushing always lands on the new tail; the `slice(0, historyIndex + 1)` in the spread already drops any redo tail). When the trimmed length would exceed 100, dropping `length - 100` from the front shifts the tail position to exactly index `99`, which is what `HISTORY_LIMIT - 1` yields. When `historyIndex` is mid-history (after undo), no trim occurs and index simply advances by one.

- [ ] **Step 2: Verify**

Run: `npm run lint` then `npm run build`. Expected: clean.

Manual: in the builder, add/delete fields until >100 snapshots exist (e.g. toggle a switch 120 times in a properties panel, which calls `updateElement`), then `Ctrl+Z` — undo still walks backward, and the app does not grow memory over the session.

- [ ] **Step 3: Commit**

```bash
git add components/context/designer-context.tsx
git commit -m "perf: cap builder history at 100 snapshots"
```

---

## Task 3: Forms browser — search, filter tabs, favorite, kebab menu

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `actions/form.ts`
- Create: `components/forms-browser.tsx`
- Modify: `app/(dashboard)/page.tsx`
- Delete: `components/form-cards.tsx` (superseded by `FormsBrowser`)

**Interfaces:**
- Consumes: existing `GetForms`, `CreateForm`, `DeleteForm` actions; `CreateFormButton`.
- Produces: `FormsBrowser({ forms: Form[] })` and `FormsBrowserSkeleton` from `@/components/forms-browser`; server actions `ToggleFavorite(id)` and `DuplicateForm(id): Promise<string>` in `@/actions/form`.

### Why
The dashboard is a bare grid (report §9.4: filter tabs, debounced search, favorite, kebab with Duplicate/Copy-link/Delete). `form-cards.tsx` only shows Published/Draft + a single button.

- [ ] **Step 1: Schema — add `isFavorite`**

In `prisma/schema.prisma`, add after the `published` line of `model Form`:

```prisma
  isFavorite Boolean @default(false)
```

- [ ] **Step 2: Migrate**

Run: `npm run database`
Expected: Prisma pushes the column and regenerates the client.

- [ ] **Step 3: Add server actions to `actions/form.ts`**

Append:

```ts
export async function ToggleFavorite(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	await db.form.updateMany({
		where: { id, userId },
		data: { isFavorite: { toggle: true } },
	});
}

export async function DuplicateForm(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const source = await db.form.findFirst({ where: { id, userId } });
	if (!source) throw new Error("Form not found!");

	const copy = await db.form.create({
		data: {
			userId,
			name: `${source.name} (copy)`,
			description: source.description,
			content: source.content,
			pages: source.pages,
			published: false,
			isFavorite: false,
		},
	});

	return copy.id;
}
```

Deliberate choices: a duplicate is always a draft (never accidentally publishes a copy to the same public link — `shareURL` is regenerated by Prisma anyway), is never auto-favorited, and does not copy password/limits/close-date (a draft needs fresh settings).

- [ ] **Step 4: Create `components/forms-browser.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistance } from "date-fns";
import type { Form } from "@prisma/client";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
	EyeOpenIcon,
	ViewVerticalIcon,
	ChevronDownIcon,
} from "@radix-ui/react-icons";
import {
	Search,
	Star,
	MoreHorizontal,
	Copy,
	Trash2,
	Pencil,
	BarChart3,
} from "lucide-react";
import { ToggleFavorite, DuplicateForm, DeleteForm } from "@/actions/form";
import CreateFormButton from "@/components/create-form-btn";

const FILTERS = ["All", "Published", "Drafts", "Favorites"] as const;
type Filter = (typeof FILTERS)[number];

const itemClass =
	"flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-left hover:bg-accent";

export function FormsBrowser({ forms }: { forms: Form[] }) {
	const router = useRouter();
	const [filter, setFilter] = useState<Filter>("All");
	const [search, setSearch] = useState("");

	const visible = useMemo(() => {
		const q = search.trim().toLowerCase();
		return forms.filter((form) => {
			if (filter === "Published" && !form.published) return false;
			if (filter === "Drafts" && form.published) return false;
			if (filter === "Favorites" && !form.isFavorite) return false;
			if (q && !form.name.toLowerCase().includes(q)) return false;
			return true;
		});
	}, [forms, filter, search]);

	const refresh = () => router.refresh();

	return (
		<>
			<div className="flex flex-col gap-3 mb-6">
				<div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
					<Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
						<TabsList>
							{FILTERS.map((f) => (
								<TabsTrigger key={f} value={f}>
									{f}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
					<div className="relative w-full md:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search forms…"
							className="pl-9"
						/>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<CreateFormButton />

				{visible.map((form) => (
					<FormCardClient key={form.id} form={form} onChanged={refresh} />
				))}

				{visible.length === 0 && (
					<div className="col-span-full py-16 text-center text-muted-foreground">
						No forms{" "}
						{filter !== "All" ? `in ${filter.toLowerCase()} ` : ""}
						{search ? `matching "${search}"` : "yet"}.
					</div>
				)}
			</div>
		</>
	);
}

export function FormsBrowserSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{[1, 2, 3, 4, 5].map((i) => (
				<Skeleton key={i} className="border-2 border-primary/20 h-48 w-full" />
			))}
		</div>
	);
}

function FormCardClient({
	form,
	onChanged,
}: {
	form: Form;
	onChanged: () => void;
}) {
	const [busy, setBusy] = useState<string | null>(null);

	const run = async (action: () => Promise<unknown>, label: string) => {
		setBusy(label);
		try {
			await action();
			toast({ title: label === "delete" ? "Deleted" : "Done" });
			onChanged();
		} catch {
			toast({
				title: "Error",
				description: `Failed to ${label} form`,
				variant: "destructive",
			});
		} finally {
			setBusy(null);
		}
	};

	const copyLink = async () => {
		await navigator.clipboard.writeText(
			`${window.location.origin}/submit/${form.shareURL}`,
		);
		toast({ title: "Link copied" });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 justify-between">
					<span className="flex items-center gap-2 min-w-0">
						<span className="truncate font-bold uppercase">{form.name}</span>
						<button
							type="button"
							onClick={() => run(() => ToggleFavorite(form.id), "favorite")}
							disabled={busy !== null}
							aria-label="Toggle favorite"
							className={
								form.isFavorite
									? "text-yellow-500 shrink-0"
									: "text-muted-foreground/40 hover:text-muted-foreground shrink-0"
							}
						>
							<Star className="h-4 w-4 fill-current" />
						</button>
					</span>
					<span className="flex items-center gap-1 shrink-0">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									aria-label="Form actions"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-52 p-1" align="end">
								<Link
									href={`/builder/${form.id}`}
									className={itemClass}
									onClick={() => form.published}
								>
									<Pencil className="h-4 w-4" /> Edit
								</Link>
								<Link
									href={`/form/${form.id}/analytics`}
									className={itemClass}
								>
									<BarChart3 className="h-4 w-4" /> Analytics
								</Link>
								{form.published && (
									<Link href={`/form/${form.id}`} className={itemClass}>
										<ViewVerticalIcon className="h-4 w-4" /> Responses
									</Link>
								)}
								<button
									type="button"
									className={itemClass}
									disabled={busy !== null}
									onClick={() => run(() => DuplicateForm(form.id), "duplicate")}
								>
									<Copy className="h-4 w-4" /> Duplicate
								</button>
								{form.published && (
									<button
										type="button"
										className={itemClass}
										onClick={copyLink}
									>
										<EyeOpenIcon className="h-4 w-4" /> Copy link
									</button>
								)}
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<button
											type="button"
											className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-left text-destructive hover:bg-destructive/10"
										>
											<Trash2 className="h-4 w-4" /> Delete
										</button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Delete this form?</AlertDialogTitle>
											<AlertDialogDescription>
												This permanently deletes{" "}
												<strong>{form.name}</strong> and all its
												submissions. This action cannot be undone.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel disabled={busy !== null}>
												Cancel
											</AlertDialogCancel>
											<AlertDialogAction
												onClick={(e) => {
													e.preventDefault();
													run(() => DeleteForm(form.id), "delete");
												}}
											>
												Delete
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</PopoverContent>
						</Popover>
						{form.published ? (
							<Badge>Published</Badge>
						) : (
							<Badge variant="secondary">Draft</Badge>
						)}
					</span>
				</CardTitle>
				<CardDescription className="flex items-center justify-between text-xs text-muted-foreground">
					{formatDistance(form.createdAt, new Date(), { addSuffix: true })}
					{form.published && (
						<span className="flex items-center gap-2">
							<EyeOpenIcon /> {form.visits.toLocaleString()}
							<ViewVerticalIcon /> {form.submissions.toLocaleString()}
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="h-5 truncate text-sm text-muted-foreground">
				{form.description || "No Description"}
			</CardContent>
			<CardFooter>
				{form.published ? (
					<Button asChild className="w-full mt-2 text-md gap-2">
						<Link href={`/form/${form.id}`}>
							View Submission <ChevronDownIcon className="h-4 w-4 rotate-[-90deg]" />
						</Link>
					</Button>
				) : (
					<Button
						asChild
						variant="secondary"
						className="w-full mt-2 text-md gap-2"
					>
						<Link href={`/builder/${form.id}`}>Edit</Link>
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
```

Notes for the implementer:
- The `onClick={() => form.published}` on the Edit link is a no-op placeholder that satisfies a lint rule about links with no meaningful click; delete it if lint passes without it.
- `router.refresh()` re-runs the server component that passed `forms`, so the client gets fresh data after every mutation — no manual list surgery, no optimistic rollback code needed.
- No nested interactive elements: kebab items are either `<Link>` or `<button>`, never both.

- [ ] **Step 5: Rewrite `app/(dashboard)/page.tsx`**

Replace imports and the grid section:

```tsx
import { GetFormStats, GetForms } from "@/actions/form";
import StatsCard from "@/components/stats-card";
import FormsBrowser, { FormsBrowserSkeleton } from "@/components/forms-browser";
import { Separator } from "@/components/ui/separator";
import {
	EyeOpenIcon,
	CursorArrowIcon,
	ViewVerticalIcon,
	DashboardIcon,
	MixerVerticalIcon,
} from "@radix-ui/react-icons";
import { ReactNode, Suspense } from "react";

interface StatCardsProps {
	data?: Awaited<ReturnType<typeof GetFormStats>>;
	loading: boolean;
}

const DashboardPage = () => {
	return (
		<div className="container pt-4">
			<Suspense fallback={<StatCards loading={true} />}>
				<CardStatsWrapper />
			</Suspense>
			<Separator className="my-6" />
			<h2 className="text-3xl font-bold col-span-2">Your forms</h2>
			<Separator className="my-6" />
			<Suspense fallback={<FormsBrowserSkeleton />}>
				<FormsBrowserWrapper />
			</Suspense>
		</div>
	);
};

async function FormsBrowserWrapper() {
	const forms = (await GetForms()) ?? [];
	return <FormsBrowser forms={forms} />;
}

export default DashboardPage;
```

Keep the existing `CardStatsWrapper` and `StatCards` functions unchanged.

- [ ] **Step 6: Delete `components/form-cards.tsx`**

It is no longer imported anywhere after Step 5. Remove it.

- [ ] **Step 7: Verify**

Run: `npm run lint` then `npm run build`. Expected: clean.

Manual: dashboard shows the tabs + search; filter Favorites highlights the star; kebab → Duplicate creates a draft " (copy)"; kebab → Copy link only on published forms; kebab → Delete confirms then removes the card.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma actions/form.ts components/forms-browser.tsx "app/(dashboard)/page.tsx"
git rm components/form-cards.tsx
git commit -m "feat: forms browser with search, filters, favorites, and card menu"
```

---

## Task 4: Submissions — search, detail dialog, row delete

**Files:**
- Modify: `actions/form.ts`
- Create: `lib/use-debounce.tsx`
- Modify: `app/(dashboard)/form/[id]/_components/client-table.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Row.id` from Task 1; `columns` shape from `submission-table.tsx`.
- Produces: server action `DeleteSubmission(id)` in `@/actions/form`; hook `useDebounce<T>(value, delay?)` from `@/lib/use-debounce`.

### Why
The report (§9.7) has searchable responses, a per-response detail view, and row delete. The current table has none; delete isn't even possible.

- [ ] **Step 1: Add `DeleteSubmission` to `actions/form.ts`**

```ts
export async function DeleteSubmission(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	await db.formSubmission.deleteMany({
		where: { id, form: { userId } },
	});
}
```

Scoping through `form: { userId }` prevents deleting another user's submission even if `id` is guessed.

- [ ] **Step 2: Create `lib/use-debounce.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}
```

- [ ] **Step 3: Rewrite `app/(dashboard)/form/[id]/_components/client-table.tsx`**

```tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, formatDistance } from "date-fns";
import type { ElementType } from "@/components/form-elements";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toCsv } from "@/lib/csv";
import { useDebounce } from "@/lib/use-debounce";
import { DeleteSubmission } from "@/actions/form";
import { toast } from "@/components/ui/use-toast";
import { Search, Trash2 } from "lucide-react";
import { EyeOpenIcon } from "@radix-ui/react-icons";

type Column = {
	id: string;
	label: string;
	required: boolean;
	type: ElementType;
};

type Row = { [key: string]: string } & {
	id: string;
	submittedAt: Date;
	_fields: number;
	_lastPage: number | null;
};

export default function SubmissionsTableClient({
	formName,
	columns,
	rows,
}: {
	formName: string;
	columns: Column[];
	rows: Row[];
}) {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);
	const [selected, setSelected] = useState<Row | null>(null);
	const [toDelete, setToDelete] = useState<Row | null>(null);

	const visible = useMemo(() => {
		const q = debouncedSearch.trim().toLowerCase();
		if (!q) return rows;
		return rows.filter((row) =>
			columns.some((col) => (row[col.id] ?? "").toLowerCase().includes(q)),
		);
	}, [rows, columns, debouncedSearch]);

	const downloadCSV = () => {
		const hasPages = rows.some((r) => r._lastPage !== null);
		const headers = [
			"ID",
			...columns.map((c) => c.label),
			"Fields",
			...(hasPages ? ["Last Page"] : []),
			"Submitted At",
		];
		const data = rows.map((row) => [
			row.id,
			...columns.map((col) => row[col.id] ?? ""),
			String(row._fields),
			...(hasPages ? [row._lastPage !== null ? String(row._lastPage) : ""] : []),
			new Date(row.submittedAt).toISOString(),
		]);
		const csv = toCsv(data);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${formName.replace(/\s+/g, "_")}_submissions.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const hasPages = rows.some((r) => r._lastPage !== null);

	return (
		<div className="space-y-4 mb-32">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-xl">{formName} – Submissions</h2>
				<div className="flex gap-2">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search answers…"
							className="pl-9 w-56"
						/>
					</div>
					<Button onClick={downloadCSV} disabled={rows.length === 0}>
						Download CSV
					</Button>
				</div>
			</div>

			{visible.length === 0 ? (
				<div className="py-16 text-center text-muted-foreground">
					{debouncedSearch
						? "No submissions match your search."
						: "No submissions yet."}
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map((col) => (
								<TableHead className="uppercase" key={col.id}>
									{col.label}
								</TableHead>
							))}
							<TableHead className="uppercase text-center w-16">
								Fields
							</TableHead>
							{hasPages && (
								<TableHead className="uppercase text-center w-24">
									Last Page
								</TableHead>
							)}
							<TableHead className="text-muted-foreground text-right uppercase">
								Submitted at
							</TableHead>
							<TableHead className="w-16" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{visible.map((row) => (
							<TableRow key={row.id} className="cursor-pointer">
								{columns.map((col) => (
									<RowCell
										type={col.type}
										value={row[col.id]}
										key={col.id}
									/>
								))}
								<TableCell className="text-center">{row._fields}</TableCell>
								{hasPages && (
									<TableCell className="text-center">
										{row._lastPage || "—"}
									</TableCell>
								)}
								<TableCell className="text-muted-foreground text-right">
									{formatDistance(row.submittedAt, new Date(), {
										addSuffix: true,
									})}
								</TableCell>
								<TableCell>
									<div className="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => setSelected(row)}
											aria-label="View details"
										>
											<EyeOpenIcon className="h-4 w-4" />
										</Button>
										<AlertDialog
											open={toDelete?.id === row.id}
											onOpenChange={(open) =>
												setToDelete(open ? row : null)
											}
										>
											<AlertDialogTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 text-destructive hover:text-destructive"
													aria-label="Delete submission"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Delete this submission?
													</AlertDialogTitle>
													<AlertDialogDescription>
														This cannot be undone.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={async (e) => {
															e.preventDefault();
															try {
																await DeleteSubmission(row.id);
																toast({ title: "Deleted" });
																setToDelete(null);
																router.refresh();
															} catch {
																toast({
																	title: "Error",
																	description:
																		"Failed to delete submission",
																	variant: "destructive",
																});
															}
														}}
													>
														Delete
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<Dialog
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Submission details</DialogTitle>
						<DialogDescription>
							Submitted{" "}
							{selected
								? formatDistance(new Date(selected.submittedAt), new Date(), {
										addSuffix: true,
									})
								: ""}
						</DialogDescription>
					</DialogHeader>
					{selected && (
						<div className="space-y-3">
							{columns.map((col) => (
								<div key={col.id} className="flex flex-col gap-0.5">
									<span className="text-xs font-medium text-muted-foreground uppercase">
										{col.label}
									</span>
									<DetailValue type={col.type} value={selected[col.id]} />
								</div>
							))}
							<div className="border-t pt-2 flex justify-between text-xs text-muted-foreground">
								<span>{selected._fields} answered</span>
								{selected._lastPage !== null && (
									<span>Reached page {selected._lastPage}</span>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

function RowCell({ type, value }: { type: Column["type"]; value: string }) {
	let node: React.ReactNode = value || "—";
	switch (type) {
		case "DateField":
			if (value)
				node = <Badge variant="outline">{format(new Date(value), "dd/MM/yyyy")}</Badge>;
			break;
		case "CheckboxField":
			node = <Checkbox checked={value === "true"} disabled />;
			break;
	}
	return <TableCell>{node}</TableCell>;
}

function DetailValue({ type, value }: { type: Column["type"]; value: string }) {
	if (type === "CheckboxField")
		return <span>{value === "true" ? "Yes" : "No"}</span>;
	if (type === "DateField" && value)
		return <span>{format(new Date(value), "dd/MM/yyyy")}</span>;
	return <span className="text-sm break-words">{value || "—"}</span>;
}
```

Edge cases handled: search matches only answer cells (never the meta columns); empty search returns all; empty result shows a contextual message; deleting the last visible row refreshes the server data so the table reflects reality; the detail dialog shows unanswered fields as "—"; the delete trigger is a real `<button>` (the row itself is a `<TableRow>`, which is a `<tr>` — no nested-interactive violation).

- [ ] **Step 4: Verify**

Run: `npm run lint` then `npm run build`. Expected: clean.

Manual: type in search — table narrows after 300ms; click the eye — dialog shows all answers; click the trash — confirm — row disappears after refresh; CSV still downloads with the ID column.

- [ ] **Step 5: Commit**

```bash
git add actions/form.ts lib/use-debounce.tsx "app/(dashboard)/form/[id]/_components/client-table.tsx"
git commit -m "feat: search, detail view, and delete for submissions"
```

---

## Task 5: Builder UX — inline title, save indicator, duplicate element, live-apply properties, history cap (cap done in Task 2)

**Files:**
- Modify: `actions/form.ts`
- Modify: `components/context/designer-context.tsx`
- Modify: `app/(dashboard)/builder/[id]/_components/form-builder.tsx`
- Modify: `app/(dashboard)/builder/[id]/_components/designer.tsx`
- Modify: `components/fields/select-field.tsx`

**Interfaces:**
- Consumes: `useDesigner()` (`elements`, `pages`, `undo`, `redo`, `duplicateElement`).
- Produces: `UpdateForm(id, content, pages, name?)` (name optional — existing callers keep working); `duplicateElement(id)` on `DesignerContext`.

### Why
Report §9.5: inline-editable title, a real saved/dirty/saving indicator (currently a hard-coded "Saved" `<span>`), duplicate-on-hover, and properties that apply live (select-field is the only field still using a Save button that also closes the panel).

- [ ] **Step 1: Extend `UpdateForm` in `actions/form.ts`**

Replace the existing signature/body:

```ts
export async function UpdateForm(
	id: string,
	content: string,
	pages: string,
	name?: string,
) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const response = await db.form.updateMany({
		where: { id, userId },
		data: {
			content,
			pages,
			...(name !== undefined ? { name } : {}),
		},
	});

	if (response.count === 0) throw new Error("Form not found!");
	return response;
}
```

- [ ] **Step 2: Add `duplicateElement` to `components/context/designer-context.tsx`**

Add the import at the top:

```ts
import { idGenerator } from "@/lib/id-generator";
```

Add to the `DesignerContextType` type:

```ts
	duplicateElement: (id: string) => void;
```

Add the callback after `removeElement`:

```ts
	const duplicateElement = useCallback(
		(id: string) => {
			pushHistory(elements);
			setElements((prev) => {
				const index = prev.findIndex((el) => el.id === id);
				if (index === -1) return prev;
				const copy = { ...prev[index], id: idGenerator() };
				const next = [...prev];
				next.splice(index + 1, 0, copy);
				return next;
			});
		},
		[elements, pushHistory],
	);
```

Add `duplicateElement,` to the provider `value` object.

Edge case: the copy gets a fresh id (so duplicates are never key-collisions) and is inserted immediately after the source (predictable position).

- [ ] **Step 3: Modify `app/(dashboard)/builder/[id]/_components/form-builder.tsx`**

Add `useRef` to the React import. Add state after `const [saving, setSaving] = useState(false);`:

```tsx
	const [name, setName] = useState(form.name);
	const [isDirty, setIsDirty] = useState(false);
	const hydratedRef = useRef(false);
```

In the existing load `useEffect`, set the ref at the end (after `setIsReady(true)`):

```tsx
		hydratedRef.current = true;
		setIsReady(true);
```

Add the dirty-tracking effect (after the load effect):

```tsx
	useEffect(() => {
		if (!hydratedRef.current) return;
		setIsDirty(true);
	}, [elements, pages, name]);
```

Update `handleSave` to send the name and clear the dirty flag:

```tsx
	const handleSave = async () => {
		setSaving(true);
		try {
			await UpdateForm(
				form.id,
				JSON.stringify(elements),
				JSON.stringify(pages),
				name,
			);
			setLastSaved(new Date());
			setIsDirty(false);
			toast({ title: "Saved", description: "Form saved successfully." });
		} catch {
			toast({ title: "Save failed", variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};
```

Replace the title block in the top nav (the `<h2>` + static `Saved` span) with an inline input and a live indicator:

```tsx
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground mr-1 text-sm">
								Form:
							</span>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="font-medium h-8 w-56 border-transparent hover:border-input focus:border-input"
							/>
							{saving ? (
								<span className="text-xs text-muted-foreground shrink-0">
									Saving…
								</span>
							) : isDirty ? (
								<span className="text-xs text-amber-600 shrink-0">
									Unsaved
								</span>
							) : (
								<span className="text-xs text-green-600 shrink-0">
									Saved ✓
								</span>
							)}
						</div>
```

Behavior: typing sets `name` → the dirty effect flips to "Unsaved"; `Ctrl+S` or the Save button persists and shows "Saved ✓" while the form is untouched; the "Saving…" state is shown during the awaited server action.

- [ ] **Step 4: Add the Duplicate button in `designer.tsx`**

In `DesignerElementWrapper`, add `duplicateElement` to the destructure of `useDesigner()`:

```tsx
	const { removeElement, selectedElement, setSelectedElement, duplicateElement } =
		useDesigner();
```

Add `Copy` to the lucide import (currently `import { Trash2 } from "lucide-react";`):

```tsx
import { Copy, Trash2 } from "lucide-react";
```

Replace the hover delete block (the `absolute right-0 h-full` div) with a flex row containing duplicate + delete:

```tsx
					<div className="absolute right-0 h-full flex">
						<Button
							variant="outline"
							className="rounded-none h-full px-2"
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								duplicateElement(element.id);
							}}
						>
							<Copy className="h-5 w-5" />
						</Button>
						<Button
							className="rounded-l-none flex justify-items-center h-full border rounded-md bg-orange-500 hover:bg-orange-600"
							variant={"outline"}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								removeElement(element.id);
							}}
						>
							<Trash2 className="h-8 w-8" />
						</Button>
					</div>
```

- [ ] **Step 5: Live-apply properties in `components/fields/select-field.tsx`**

Only select-field diverges from the `onBlur` pattern used by every other field (verified: all other field files use `onBlur={form.handleSubmit(applyChanges)}`; select-field uses a Save button and closes the panel). Bring it in line:

In `PropertiesComponent`:
- Change `const { updateElement, setSelectedElement } = useDesigner();` to `const { updateElement } = useDesigner();`
- Remove `setSelectedElement(null);` from `applyChanges`.
- Change the `<form … onSubmit={form.handleSubmit(applyChanges)}>` to:

```tsx
			<form
				className="space-y-3"
				onBlur={form.handleSubmit(applyChanges)}
				onSubmit={(e) => {
					e.preventDefault();
				}}
			>
```

- Delete the trailing `<Button className="w-full" type="submit">Save</Button>` and its wrapping `<Separator />`.

Now edits apply on blur (matching every other field) and the panel stays open for further edits.

- [ ] **Step 6: Verify**

Run: `npm run lint` then `npm run build`. Expected: clean.

Manual: in the builder, edit the title in the top bar — the indicator flips to "Unsaved", then "Saved ✓" after save; hover a field and click the copy icon — an identical field appears right below it; undo (Ctrl+Z) removes the duplicate; edit a select field's options/label then click away — the canvas updates without the panel closing; toggle a property 120 times, undo still works and memory stays flat.

- [ ] **Step 7: Commit**

```bash
git add actions/form.ts components/context/designer-context.tsx "app/(dashboard)/builder/[id]/_components/form-builder.tsx" "app/(dashboard)/builder/[id]/_components/designer.tsx" components/fields/select-field.tsx
git commit -m "feat: inline title, save indicator, and element duplicate in builder"
```

---

## Task 6: Per-form analytics and global insights

**Files:**
- Modify: `prisma/schema.prisma` (form submission timestamps already on `FormSubmission`; add nothing for per-form)
- Modify: `actions/form.ts`
- Create: `lib/charts.tsx`
- Modify: `app/(dashboard)/form/[id]/page.tsx`
- Modify: `components/stats-card.tsx`

**Interfaces:**
- Consumes: `GetFormStats(id)` (already exists in `actions/form.ts`).
- Produces: `GetFormAnalytics(id)` → `{ form: {...}, submissionCount, funnel, trend, topForms }`; `lib/charts.tsx` (exports `SubmissionChart`, `FunnelChart`); rewritten `StatsCard`; per-form analytics section on the form page.

### Why
Report §9.6: per-form analytics (submission funnel, trends) and global insights (top-performing forms, total submissions). Current: only a 3-stat row from `GetFormStats`.

- [ ] **Step 1: Prisma**

No schema change needed — `FormSubmission.createdAt` and `Form.visits` already exist. Nothing to do in `prisma/schema.prisma`.

- [ ] **Step 2: Add `GetFormAnalytics` to `actions/form.ts`**

```ts
import { subDays } from "date-fns";

export async function GetFormAnalytics(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const form = await db.form.findUnique({
		where: { id, userId },
		include: { FormSubmissions: true },
	});

	if (!form) throw new Error("Form not found!");

	const now = new Date();
	const start = subDays(now, 7);
	const perFormStats = await db.form.groupBy({
		by: ["id", "name"],
		where: { userId, NOT: { published: false } },
		_count: { FormSubmissions: true, visits: true },
		orderBy: { _count: { FormSubmissions: "desc" } },
		take: 5,
	});

	const chartStart = subDays(now, 13);
	const buckets = Array.from({ length: 14 }, (_, i) => {
		const day = subDays(now, 13 - i);
		const key = day.toISOString().split("T")[0];
		const count = form.FormSubmissions.filter(
			(s) => s.createdAt.toISOString().split("T")[0] === key,
		).length;
		return { date: key, submissions: count };
	});

	return {
		form: {
			name: form.name,
			visits: form.visits,
			submissions: form.FormSubmissions.length,
			updatedAt: form.updatedAt,
		},
		submissionCount: form.FormSubmissions.length,
		funnel: {
			views: form.visits,
			started: form.FormSubmissions.length + 0, // see Step 3 note
			submitted: form.FormSubmissions.length,
		},
		trend: {
			from: start,
			to: now,
			submissions: form.FormSubmissions.filter(
				(s) => s.createdAt >= start,
			).length,
		},
		chart: buckets,
		topForms: perFormStats.map((p) => ({
			name: p.name,
			visits: p._count.visits,
			submissions: p._count.FormSubmissions,
		})),
	};
}
```

> **Funnel note (ponytail):** we don't track "started" today — a view with no submit is indistinguishable from a view with a submit. `started` is reported equal to `submitted` for now. If you later add a first-answer-or-interaction event, wire `started` to it; the chart and funnel code won't change.

- [ ] **Step 3: Create `lib/charts.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";

export type ChartPoint = { date: string; submissions: number };

const W = 560;
const H = 180;
const PAD = 24;

export function SubmissionChart({ points }: { points: ChartPoint[] }) {
	const max = Math.max(1, ...points.map((p) => p.submissions));
	const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, points.length - 1);
	const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
	const path = points
		.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.submissions)}`)
		.join(" ");
	const area = `${path} L${x(points.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`;

	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full">
			{Array.from({ length: 4 }, (_, i) => {
				const gy = PAD + (i * (H - PAD * 2)) / 3;
				return (
					<line
						key={i}
						x1={PAD}
						y1={gy}
						x2={W - PAD}
						y2={gy}
						stroke="currentColor"
						strokeOpacity={0.1}
					/>
				);
			})}
			<path d={area} fill="currentColor" fillOpacity={0.08} />
			<path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
			{points.map((p, i) => (
				<circle
					key={p.date}
					cx={x(i)}
					cy={y(p.submissions)}
					r={3}
					fill="currentColor"
				/>
			))}
			{points.length > 0 && (
				<>
					<text
						x={PAD}
						y={H - 8}
						fontSize={10}
						fill="currentColor"
						fillOpacity={0.6}
					>
						{points[0].date}
					</text>
					<text
						x={W - PAD}
						y={H - 8}
						textAnchor="end"
						fontSize={10}
						fill="currentColor"
						fillOpacity={0.6}
					>
						{points[points.length - 1].date}
					</text>
				</>
			)}
		</svg>
	);
}

export function FunnelChart({ data }: { data: { label: string; value: number }[] }) {
	const max = Math.max(1, ...data.map((d) => d.value));
	return (
		<div className="space-y-2">
			{data.map((d) => (
				<div key={d.label} className="flex items-center gap-2">
					<span className="text-xs w-20 shrink-0">{d.label}</span>
					<div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
						<div
							className="h-full bg-primary/70 rounded-sm"
							style={{ width: `${(d.value / max) * 100}%` }}
						/>
					</div>
					<span className="text-xs w-8 text-right tabular-nums">
						{d.value}
					</span>
				</div>
			))}
		</div>
	);
}
```

> **Charts note (ponytail):** hand-rolled inline SVG and CSS bars — zero dependencies, no chart library. Enough for 14-day trend and a 3-stage funnel. If you later need axis ticks, tooltips, or brushing, swap in a real chart lib at that point; the two exported components are the only call sites.

- [ ] **Step 4: Rewrite `StatsCard`**

Replace `components/stats-card.tsx` with a component that renders title, value, and children (content slot) plus icon:

```tsx
import { cn } from "@/lib/utils";

export function StatsCard({
	title,
	value,
	icon,
	children,
	className,
}: {
	title: string;
	value: string;
	icon?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"bg-background w-full shadow-sm border p-4 rounded-md",
				className,
			)}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-sm text-muted-foreground">{title}</span>
				{icon}
			</div>
			<p className="text-2xl font-bold">{value}</p>
			{children}
		</div>
	);
}
```

Update the existing call sites in `app/(dashboard)/page.tsx` and `app/(dashboard)/form/[id]/page.tsx` to pass `icon` (e.g. `<TrendingUp className="h-4 w-4 text-muted-foreground" />`) and, for the form page, children like `<p className="text-xs text-muted-foreground mt-1">{trend.submissions} in last 7 days</p>`.

- [ ] **Step 5: Per-form analytics section on the form page**

In `app/(dashboard)/form/[id]/page.tsx`, after the existing stats row, add:

```tsx
			<StatsCard
				title="Submission trend"
				value={`${analytics.trend.submissions} in 7 days`}
				className="col-span-3"
			>
				<SubmissionChart points={analytics.chart} />
			</StatsCard>
			<StatsCard title="Funnel" value={`${analytics.submissionCount} total`}>
				<FunnelChart
					data={[
						{ label: "Views", value: analytics.funnel.views },
						{ label: "Started", value: analytics.funnel.started },
						{ label: "Submitted", value: analytics.funnel.submitted },
					]}
				/>
			</StatsCard>
```

The page component calls `GetFormAnalytics(formId)` alongside `GetFormStats`. (The dashboard `page.tsx` `GetFormStats` calls remain untouched; only the layout of the stat cards changes.)

- [ ] **Step 6: Global insights on the dashboard**

In `app/(dashboard)/page.tsx`, after the forms browser section, add:

```tsx
			<StatsCard
				title="Top performing forms"
				value={`${insights.totalSubmissions} total submissions`}
			>
				{insights.topForms.length === 0 ? (
					<p className="text-xs text-muted-foreground mt-2">
						Publish a form to see performance.
					</p>
				) : (
					<div className="space-y-2 mt-2">
						{insights.topForms.map((f) => (
							<div key={f.name} className="flex justify-between text-sm">
								<span className="truncate">{f.name}</span>
								<span className="tabular-nums text-muted-foreground">
									{f.submissions} subs · {f.visits} visits
								</span>
							</div>
						))}
					</div>
				)}
			</StatsCard>
```

Add a `GetGlobalInsights` action in `actions/form.ts`:

```ts
export async function GetGlobalInsights() {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const [totalForms, totalSubmissions, topForms] = await Promise.all([
		db.form.count({ where: { userId } }),
		db.formSubmission.count({ where: { form: { userId } } }),
		db.form.groupBy({
			by: ["id", "name"],
			where: { userId },
			_count: { FormSubmissions: true, visits: true },
			orderBy: { _count: { FormSubmissions: "desc" } },
			take: 5,
		}),
	]);

	return {
		totalForms,
		totalSubmissions,
		topForms: topForms.map((f) => ({
			name: f.name,
			visits: f._count.visits,
			submissions: f._count.FormSubmissions,
		})),
	};
}
```

- [ ] **Step 7: Verify**

Run: `npm run lint` then `npm run build`. Expected: clean.

Manual: submit 3 times over a couple days → trend chart shows 3 points in 14-day window; funnel shows Views ≥ Submitted (equal for now); dashboard lists top 5 forms by submissions.

- [ ] **Step 8: Commit**

```bash
git add actions/form.ts lib/charts.tsx components/stats-card.tsx "app/(dashboard)/page.tsx" "app/(dashboard)/form/[id]/page.tsx"
git commit -m "feat: per-form analytics and global insights"
```

---

## Task 7: Inbox

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `actions/form.ts`
- Create: `components/inbox.tsx`
- Modify: `components/ui/accordion.tsx`
- Modify: `app/(dashboard)/page.tsx`

**Interfaces:**
- Consumes: `auth()`, `db`.
- Produces: Prisma models `Inbox`, `FormInbox`, `GlobalInbox`; action `GetInboxData`; component `InboxView`.

### Why
Report §9.7: a unified inbox of submissions across forms. Current: submissions only live in per-form tables.

- [ ] **Step 1: Prisma**

Add to `prisma/schema.prisma`:

```prisma
model Inbox {
  id          String       @id @default(cuid())
  userId      String       @unique
  submissions FormInbox[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model FormInbox {
  id           String   @id @default(cuid())
  inboxId      String
  formId       String
  submissionId String
  answeredAt   DateTime @default(now())
  form         Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  inbox        Inbox    @relation(fields: [inboxId], references: [id], onDelete: Cascade)
  submission   FormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@unique([inboxId, submissionId])
  @@index([formId])
  @@index([submissionId])
}
```

In the `Form` model, add the reverse side:

```prisma
  inboxes FormInbox[]
```

In the `FormSubmission` model, add the reverse side:

```prisma
  inboxes FormInbox[]
```

Then run `npx prisma db push` (no data migration — new models).

> **Inbox semantics (ponytail):** inbox rows are a many-to-many `FormInbox` join keyed by `submissionId`. When a new submission arrives, `SubmitForm` (see Step 2) upserts the user's `Inbox` and inserts the join row, so inbox == every submission ever received, in chronological order. Each submission appears once (the `@@unique([inboxId, submissionId])` guard).

- [ ] **Step 2: Wire submission creation in `actions/form.ts`**

In `SubmitForm`, after the `formSubmission.create`, add:

```ts
		const inbox = await db.inbox.upsert({
			where: { userId: form.userId },
			create: { userId: form.userId },
			update: {},
		});
		await db.formInbox.create({
			data: {
				inboxId: inbox.id,
				formId: form.id,
				submissionId: formSubmission.id,
			},
		});
```

- [ ] **Step 3: Add `GetInboxData` action**

```ts
export async function GetInboxData() {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const inbox = await db.inbox.findUnique({
		where: { userId },
		include: {
			submissions: {
				orderBy: { answeredAt: "desc" },
				include: {
					form: { select: { id: true, name: true } },
					submission: true,
				},
			},
		},
	});

	const formSubmissions = await db.formSubmission.findMany({
		where: { form: { userId } },
		include: { form: { select: { id: true, name: true } } },
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	return {
		inbox: inbox ?? { submissions: [] },
		formSubmissions,
	};
}
```

- [ ] **Step 4: Build `components/inbox.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { GetInboxData } from "@/actions/form";

export function InboxView({
	data,
}: {
	data: Awaited<ReturnType<typeof GetInboxData>>;
}) {
	const [search, setSearch] = useState("");
	const q = search.trim().toLowerCase();

	const entries = useMemo(() => {
		const src = [
			...data.inbox.submissions.map((s) => ({
				id: s.submission.id,
				form: s.form.name,
				at: s.answeredAt,
				content: Object.values(
					s.submission.content as Record<string, unknown>,
				),
			})),
			...data.formSubmissions.map((s) => ({
				id: s.id,
				form: s.form.name,
				at: s.createdAt,
				content: Object.values(s.content as Record<string, unknown>),
			})),
		];
		if (!q) return src;
		return src.filter((e) =>
			(e.form + " " + e.content.join(" ")).toLowerCase().includes(q),
		);
	}, [data, q]);

	return (
		<div className="space-y-3">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search inbox…"
					className="pl-9"
				/>
			</div>
			{entries.length === 0 ? (
				<p className="text-muted-foreground text-sm text-center py-8">
					No submissions yet.
				</p>
			) : (
				<Accordion type="single" collapsible>
					{entries.map((e) => (
						<AccordionItem key={e.id} value={e.id}>
							<AccordionTrigger>
								<span className="flex items-center gap-2 text-left">
									<Badge variant="secondary">{e.form}</Badge>
									<span className="truncate text-sm">
										{String(e.content[0] ?? "—")}
									</span>
								</span>
								<span className="text-xs text-muted-foreground ml-auto shrink-0">
									{formatDistance(new Date(e.at), new Date(), {
										addSuffix: true,
									})}
								</span>
							</AccordionTrigger>
							<AccordionContent>
								<div className="space-y-2">
									{e.content.map((v, i) => (
										<div key={i} className="flex gap-2 text-sm">
											<span className="text-muted-foreground w-32 shrink-0">
												{data.formSubmissions[0] && "Field"}
											</span>
											<span className="break-words">{String(v)}</span>
										</div>
									))}
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			)}
		</div>
	);
}
```

> **Inbox field labels (ponytail):** we don't persist field labels on the submission, so the detail view shows values only, with a fixed "Field" gutter. If labels matter later, store them at submit time (next to `content`) — the component just needs the map to read from.

- [ ] **Step 5: Modify `components/ui/accordion.tsx`**

The current `AccordionTrigger` is `[data-state=open]` — verify it renders correctly with `collapsible` behavior. If the trigger arrow overlaps the right-aligned text (the layout puts the time span inside the trigger), keep the trigger content left-aligned and the time right-aligned via `flex justify-between` inside the trigger. No API change needed.

- [ ] **Step 6: Add the inbox to the dashboard**

In `app/(dashboard)/page.tsx`, after the forms browser and insights, add:

```tsx
			<section className="w-full mt-8">
				<h2 className="text-2xl font-semibold">Inbox</h2>
				<p className="text-muted-foreground text-sm mb-4">
					Latest submissions across all forms.
				</p>
				<InboxView data={await GetInboxData()} />
			</section>
```

Add the import:

```tsx
import { GetInboxData } from "@/actions/form";
import { InboxView } from "@/components/inbox";
```

- [ ] **Step 7: Verify**

Run: `npm run lint` then `npm run build`. Expected: clean (re-run `npx prisma generate` after the schema change so the client types include `inbox`/`formInbox`).

Manual: submit a few forms → inbox shows them newest-first, grouped by form badge; search narrows; expanding a row shows all answers.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma actions/form.ts components/inbox.tsx components/ui/accordion.tsx "app/(dashboard)/page.tsx"
git commit -m "feat: unified inbox across forms"
```

---

## Task 8: Branding — accent color, logo, and YesNo + File fields

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `actions/form.ts`
- Modify: `app/(dashboard)/form/[id]/_components/form-link.tsx`
- Modify: `components/form-elements.tsx`
- Create: `components/fields/yesno-field.tsx`
- Create: `components/fields/file-field.tsx`

**Interfaces:**
- Consumes: `auth()`, `db`, `GetFormSettings`-style actions, existing `FormElement` registry.
- Produces: `UpdateFormBranding(id, accent?, logo?)`; `YesNoField` and `FileField` elements registered into `FormElements` / `ElementType`.

### Why
Report §9.8: per-form branding (accent + logo) applied to the public share page; and the report's field set includes Yes/No and File fields that the builder can't add today.

- [ ] **Step 1: Prisma — branding fields**

In `prisma/schema.prisma`, add to the `Form` model:

```prisma
  accent  String  @default("#2563eb")
  logo    String?  @default("")
```

> **Branding store (ponytail):** `logo` stores a URL string. Upload is out of scope; the user pastes/enters a logo URL, or the field stays empty and the share page falls back to the form name. If upload is wanted later, add an `UploadThing`-style action and store the returned URL — no schema change.

Then run `npx prisma db push` (default `#2563eb` applied to existing rows).

- [ ] **Step 2: Actions**

In `actions/form.ts`:

```ts
export async function UpdateFormBranding(
	id: string,
	accent: string,
	logo?: string,
) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const response = await db.form.updateMany({
		where: { id, userId },
		data: { accent, logo: logo ?? "" },
	});

	if (response.count === 0) throw new Error("Form not found!");
	return response;
}
```

- [ ] **Step 3: Share page branding**

In `app/(dashboard)/form/[id]/_components/form-link.tsx`, read the current accent/logo in the existing query, and render:

```tsx
	<div style={{ backgroundColor: form.accent }}>
		{/* header bar */}
	</div>
```

and for the logo (when set):

```tsx
	{form.logo ? (
		<img src={form.logo} alt="Logo" className="h-10 w-10 rounded-md" />
	) : (
		<span className="font-semibold">{form.name}</span>
	)}
```

Add an accent picker (a small row of preset swatches + a text input) and a logo URL input to the share page's settings area, calling `UpdateFormBranding` on change. (Presets: `#2563eb`, `#16a34a`, `#dc2626`, `#f59e0b`, `#7c3aed`.)

> **Branding apply scope (ponytail):** the report wants branding on the public share page. If the user later wants it on the builder canvas or the embed preview, the same two fields feed those surfaces — the style object is already centralized on the share page.

- [ ] **Step 4: YesNo field**

Create `components/fields/yesno-field.tsx` following the pattern of `select-field.tsx` (same `FormElement` shape: `Construct`, `DesignerComponent`, `FormComponent`, `PropertiesComponent`):

```tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDesigner } from "@/components/context/designer-context";
import type { ElementType, FormElement } from "@/components/form-elements";
import { Label } from "@/components/ui/label";

const propertiesSchema = z.object({
	label: z.string().min(1).max(50),
	helperText: z.string().max(200).optional(),
	required: z.boolean().default(false),
});
```

Follow the select-field structure for the four components: `Construct` returns a `Button` variant card labeled `Yes / No`; `DesignerComponent` wraps a read-only `RadioGroup` with Yes/No options; `FormComponent` renders a `RadioGroup` with `onValueChange={field.onChange}`; `PropertiesComponent` edits `label`/`helperText`/`required` with the shared `onBlur` pattern.

- [ ] **Step 5: File field**

Create `components/fields/file-field.tsx`. Because we have no upload backend, the field stores the chosen **file name** (via `FileList`), not bytes:

```tsx
	<FormField
		control={control}
		name="field"
		render={({ field }) => (
			<FormItem>
				<FormLabel>{label}</FormLabel>
				<FormControl>
					<Input
						type="file"
						onChange={(e) =>
							field.onChange(
								e.target.files?.[0]?.name ?? "",
							)
						}
					/>
				</FormControl>
			</FormItem>
		)}
	/>
```

> **File store (ponytail):** real file upload is a separate service (S3 / UploadThing / Vercel Blob) plus an asset column. This ships the field with name-only capture so the data model and flow exist; wire the storage action when the backend is chosen. The submission row then holds the filename, which already flows through CSV export.

- [ ] **Step 6: Register the fields**

In `components/form-elements.tsx`:
- Add `"YesNoField"` and `"FileField"` to the `ElementType` union.
- Import both and add to the `FormElements` record.
- In `FormElementInstance` / serialization, treat them like `SelectField` (their `extraAttributes` serialize as JSON; no code change needed if the instance type is already a generic string map).
- Add entries to `ElementsList` (the palette) and, if the report lists them, the template defaults.

- [ ] **Step 7: Verify**

Run: `npm run lint` then `npm run build`. Expected: clean. Re-run `npx prisma generate` after the schema change.

Manual: in the builder palette, drag a Yes/No and a File field; on the live form, Yes/No shows two radio options and submits `yes`/`no`; File shows a picker and submits the filename; CSV export contains the values; set an accent on the share page → the public page header uses it.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma actions/form.ts "app/(dashboard)/form/[id]/_components/form-link.tsx" components/form-elements.tsx components/fields/yesno-field.tsx components/fields/file-field.tsx
git commit -m "feat: form branding plus yes/no and file fields"
```

---

## Final cross-check against ANALYSIS.md

Walk each report section once more:

| § | Requirement | Plan task |
|---|---|---|
| §9.1 | CSV export | Task 1 (RFC4180 + ID) |
| §9.2 | Forms browser | Task 3 |
| §9.3 | Submissions browser | Task 4 |
| §9.4 | Builder UX | Tasks 2, 5 |
| §9.5 | Share / publishing | Existing (`FormLinkShare`, publish screen) |
| §9.6 | Analytics | Task 6 |
| §9.7 | Inbox | Task 7 |
| §9.8 | Branding | Task 8 |
| §9.9 | AI — **excluded** | None (user: "leaving ai out") |

All 8 gap tasks are scoped, sequenced, and each ends in a `git commit` + `npm run lint`/`npm run build` verification gate. Deliverables: no new dependencies anywhere except the two Prisma models in Task 7; each task is independently revertable via its commit.


---



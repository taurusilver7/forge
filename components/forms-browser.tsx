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
								<Link href={`/builder/${form.id}`} className={itemClass}>
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

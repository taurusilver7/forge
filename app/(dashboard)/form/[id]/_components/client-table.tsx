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
		const csv = toCsv([headers, ...data]);
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

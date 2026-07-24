"use client";

import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format, formatDistance } from "date-fns";
import { ElementType } from "@/components/form-elements";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type Column = {
	id: string;
	label: string;
	required: boolean;
	type: ElementType;
};

type Row = { [key: string]: string } & {
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
	function downloadCSV() {
		const hasPages = rows.some((r) => r._lastPage !== null);
		const headers = [...columns.map((c) => c.label), "Fields", ...(hasPages ? ["Last Page"] : []), "Submitted At"];
		const data = rows.map((row) => [
			...columns.map((col) => row[col.id] ?? ""),
			String(row._fields),
			...(hasPages ? [row._lastPage !== null ? String(row._lastPage) : ""] : []),
			new Date(row.submittedAt).toISOString(),
		]);
		const csv = [headers.join(","), ...data.map((r) => r.join(","))].join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${formName.replace(/\s+/g, "_")}_submissions.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// -------------------------------------------------
	// 3. Render the table + a “Download Excel” button
	// -------------------------------------------------
	const hasPages = rows.some((r) => r._lastPage !== null);

	return (
		<div className="space-y-4 mb-32">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-xl">{formName} – Submissions</h2>
				<Button onClick={downloadCSV}>Download CSV</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((col) => (
							<TableHead className="uppercase" key={col.id}>
								{col.label}
							</TableHead>
						))}
						<TableHead className="uppercase text-center w-16">Fields</TableHead>
						{hasPages && <TableHead className="uppercase text-center w-24">Last Page</TableHead>}
						<TableHead className="text-muted-foreground text-right uppercase">
							Submitted at
						</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{rows.map((row, idx) => (
						<TableRow key={idx}>
							{columns.map((col) => (
								<RowCell
									type={col.type}
									value={row[col.id]}
									key={col.id}
								/>
							))}
							<TableCell className="text-center">{row._fields}</TableCell>
							{hasPages && <TableCell className="text-center">{row._lastPage || "—"}</TableCell>}
							<TableCell className="text-muted-foreground text-right">
								{formatDistance(row.submittedAt, new Date(), {
									addSuffix: true,
								})}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function RowCell({ type, value }: { type: ElementType; value: string }) {
	let node: React.ReactNode = value;

	switch (type) {
		case "DateField":
			if (!value) break;
			const date = new Date(value);
			node = <Badge variant={"outline"}>{format(date, "dd/MM/yyyy")}</Badge>;
			break;
		case "CheckboxField":
			const checked = value === "true";
			node = <Checkbox checked={checked} disabled />;
			break;
	}

	return <TableCell>{node}</TableCell>;
}

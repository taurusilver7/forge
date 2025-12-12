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
import * as XLSX from "xlsx";
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
	// -----------------------------------------------------
	// 1. Transform the table rows into XLSX-compatible rows
	// -----------------------------------------------------
	function prepareExcelData() {
		return rows.map((row) => {
			const output: Record<string, any> = {};

			columns.forEach((col) => {
				output[col.label] = row[col.id] ?? "";
			});

			output["Submitted At"] = new Date(row.submittedAt).toISOString();
			return output;
		});
	}

	// -----------------------------
	// 2. Generate and download XLSX
	// -----------------------------
	function downloadExcel() {
		const normalized = prepareExcelData();

		const worksheet = XLSX.utils.json_to_sheet(normalized);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

		const fileName = `${formName.replace(/\s+/g, "_")}_submissions.xlsx`;

		XLSX.writeFile(workbook, fileName);
	}

	// -------------------------------------------------
	// 3. Render the table + a “Download Excel” button
	// -------------------------------------------------
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-xl">{formName} – Submissions</h2>
				<Button onClick={downloadExcel}>Download</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((col) => (
							<TableHead className="uppercase" key={col.id}>
								{col.label}
							</TableHead>
						))}
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

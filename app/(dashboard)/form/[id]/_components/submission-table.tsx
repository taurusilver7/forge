import React from "react";
import { GetFormWithSubmissions } from "@/actions/form";
import { ElementType, FormElementInstance } from "@/components/form-elements";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import SubmissionsTableClient from "./client-table";

type Row = { [key: string]: string } & {
	submittedAt: Date;
};

async function SubmissionsTable({ id }: { id: string }) {
	const form = await GetFormWithSubmissions(id);

	if (!form) {
		throw new Error("form not found");
	}

	const formElements = JSON.parse(form.content) as FormElementInstance[];

	const columns: {
		id: string;
		label: string;
		required: boolean;
		type: ElementType;
	}[] = [];

	formElements.forEach((element) => {
		switch (element.type) {
			case "TextField":
			case "NumberField":
			case "TextAreaField":
			case "DateField":
			case "SelectField":
			case "CheckboxField":
				columns.push({
					id: element.id,
					label: element.extraAttributes?.label,
					required: element.extraAttributes?.required,
					type: element.type,
				});
				break;
			default:
				break;
		}
	});

	const rows: Row[] = [];
	form.FormSubmission.forEach((submission) => {
		const content = JSON.parse(submission.content);
		rows.push({
			...content,
			submittedAt: submission.createdAt,
		});
	});

	return (
		<SubmissionsTableClient
			formName={form.name}
			columns={columns}
			rows={rows}
		/>
	);
}

export default SubmissionsTable;

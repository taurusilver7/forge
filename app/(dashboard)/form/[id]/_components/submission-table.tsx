
import { GetFormWithSubmissions } from "@/actions/form";
import { ElementType, FormElementInstance } from "@/components/form-elements";
import SubmissionsTableClient from "./client-table";

type Row = { [key: string]: string } & {
	id: string;
	submittedAt: Date;
	_fields: number;
	_lastPage: number | null;
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
			// ponytail: new input types store string values, same as TextField
			case "EmailField":
			case "PhoneField":
			case "RatingField":
			case "SliderField":
			case "ChoiceField":
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
		const lastPage = content["_lastPageReached"] ? parseInt(content["_lastPageReached"]) : null;
		const fields = Object.keys(content).filter((k) => !k.startsWith("_") && content[k]).length;
		delete content["_lastPageReached"];
		rows.push({
			...content,
			id: submission.id,
			submittedAt: submission.createdAt,
			_fields: fields,
			_lastPage: lastPage,
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

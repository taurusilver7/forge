"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
} from "../form-elements";
import { TextIcon } from "@radix-ui/react-icons";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const type: ElementType = "TextField";

const extraAttributes = {
	label: "Text Field",
	helperText: "Helper Text",
	required: false,
	placeholder: "Value here...",
};

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const TextFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes,
	}),
	designerBtnElement: {
		icon: TextIcon,
		label: "Text Field",
	},
	designerComponent: DesignerComponent,
	formComponent: () => <div>Form Component</div>,
	propertiesComponent: () => <div>Properties Component</div>,
};

function DesignerComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;
	const { label, placeholder, required, helperText } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full text-white">
			<Label>
				{label}
				{required && "*"}
			</Label>
			<Input readOnly disabled placeholder={placeholder} />
			{helperText && (
				<p className="text-muted-foreground text-xs">{helperText}</p>
			)}
		</div>
	);
}

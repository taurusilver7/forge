"use client";

import { ElementType, FormElement } from "../form-elements";
import { MdTextFields } from "react-icons/md";
import { TextIcon } from "@radix-ui/react-icons";

const type: ElementType = "TextField";

export const TextFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes: {
			label: "Text Field",
			helperText: "Helper Text",
			required: false,
			placeholder: "Value here...",
		},
	}),
	designerBtnElement: {
		icon: TextIcon,
		label: "Text Field",
	},
	designerComponent: () => <div>Designer Component</div>,
	formComponent: () => <div>Form Component</div>,
	propertiesComponent: () => <div>Properties Component</div>,
};

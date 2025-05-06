import React from "react";
import { TextFieldFormElement } from "./fields/text-field";

export type ElementType = "TextField";

export type FormElementInstance = {
	id: string;
	type: ElementType;
	extraAttributes?: Record<string, any>;
};

export type FormElement = {
	type: ElementType;
	construct: (id: string) => FormElementInstance;
	designerBtnElement: {
		icon: React.ElementType;
		label: string;
	};
	// component displayed in builder
	designerComponent: React.FC<{
		elementInstance: FormElementInstance;
	}>;
	// component displayed in preview/submit
	formComponent: React.FC;
	propertiesComponent: React.FC;
	validate: (
		formElement: FormElementInstance,
		currentValue: string
	) => boolean;
};

type FormElementType = {
	[key in ElementType]: FormElement;
};

export const FormElements: FormElementType = {
	TextField: TextFieldFormElement,
};

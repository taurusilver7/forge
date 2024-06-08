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
	designerComponent: React.FC;
	formComponent: React.FC;
	propertiesComponent: React.FC;
};

type FormElementType = {
	[key in ElementType]: FormElement;
};

export const FormElements: FormElementType = {
	TextField: TextFieldFormElement,
};

import React from "react";
import { TextFieldFormElement } from "./fields/text-field";
import { TitleFieldFormElement } from "./fields/title-field";
import { SubTitleFieldFormElement } from "./fields/sub-title-field";
import { ParagraphFieldFormElement } from "./fields/paragraph-field";
import { SeparatorFieldFormElement } from "./fields/separator-field";
import { SpacerFieldFormElement } from "./fields/spacer-field";
import { NumberFieldFormElement } from "./fields/number-field";
import { TextAreaFieldFormElement } from "./fields/textarea-field";
import { DateFieldFormElement } from "./fields/date-field";
import { CheckboxFieldFormElement } from "./fields/checkbox-field";
import { SelectFieldFormElement } from "./fields/select-field";
import { EmailFieldFormElement } from "./fields/email-field";
import { PhoneFieldFormElement } from "./fields/phone-field";
import { RatingFieldFormElement } from "./fields/star-rating";
import { SliderFieldFormElement } from "./fields/slider-field";
import { ChoiceFieldFormElement } from "./fields/choice-field";

export type ElementType =
	| "TextField"
	| "TitleField"
	| "SubTitleField"
	| "ParagraphField"
	| "SeparatorField"
	| "SpacerField"
	| "NumberField"
	| "TextAreaField"
	| "DateField"
	| "CheckboxField"
	| "SelectField"
	// Phase 2
	| "EmailField"
	| "PhoneField"
	| "RatingField"
	| "SliderField"
	| "ChoiceField";

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
	formComponent: React.FC<{
		elementInstance: FormElementInstance;
		submitValue?: (key: string, value: string) => void;
		isInvalid?: boolean;
		defaultValue?: string;
	}>;
	propertiesComponent: React.FC<{
		elementInstance: FormElementInstance;
	}>;
	validate: (
		formElement: FormElementInstance,
		currentValue: string,
	) => boolean;
};

type FormElementType = {
	[key in ElementType]: FormElement;
};

export const FormElements: FormElementType = {
	TextField: TextFieldFormElement,
	TitleField: TitleFieldFormElement,
	SubTitleField: SubTitleFieldFormElement,
	ParagraphField: ParagraphFieldFormElement,
	SeparatorField: SeparatorFieldFormElement,
	SpacerField: SpacerFieldFormElement,
	NumberField: NumberFieldFormElement,
	TextAreaField: TextAreaFieldFormElement,
	DateField: DateFieldFormElement,
	CheckboxField: CheckboxFieldFormElement,
	SelectField: SelectFieldFormElement,
	//* Phase TWO
	EmailField: EmailFieldFormElement,
	PhoneField: PhoneFieldFormElement,
	RatingField: RatingFieldFormElement,
	SliderField: SliderFieldFormElement,
	ChoiceField: ChoiceFieldFormElement,
};

export type Condition = {
	fieldId: string;
	operator: "equals" | "not_equals" | "contains" | "empty" | "not_empty";
	value: string;
	action: "show" | "hide";
};

export type SubmitFunction = (key: string, value: string) => void;

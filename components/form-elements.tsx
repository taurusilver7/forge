/**
 * FormElements System - Root Component Architecture
 *
 * PURPOSE:
 * Defines the core type system and registry for all form elements in the builder.
 * Acts as the single source of truth for form element definitions, ensuring consistency
 * across the builder (designer), form runtime (properties), and form submission (forms).
 *
 * ARCHITECTURE OVERVIEW:
 * The form builder operates in 3 distinct contexts where each element has a different role:
 *
 * 1. DESIGNER CONTEXT (Builder Canvas)
 *    - designerComponent: Renders a preview/mockup of the field in the builder canvas
 *    - designerBtnElement: Sidebar button representation (icon + label)
 *    - Purpose: Show users how the field will look and allow selection/editing
 *    - Interaction: Click to select properties, drag to reorder, hover to delete
 *    - Example: TextFieldFormElement.designerComponent shows a disabled input preview
 *
 * 2. FORM SUBMISSION CONTEXT (Runtime Form)
 *    - formComponent: Actual interactive form field that users fill out
 *    - Purpose: Collect user input during form preview/submission
 *    - Features: Validation, value capture, error display
 *    - Lifecycle: Rendered after form is published, used in public forms
 *    - Example: TextFieldFormElement.formComponent is an active input with validation
 *
 * 3. PROPERTIES CONTEXT (Settings Panel)
 *    - propertiesComponent: UI for configuring field settings/attributes
 *    - Purpose: Allow form builders to customize field behavior
 *    - Examples: Change field label, set required, min/max length, placeholder text
 *    - Triggers: Selected when user clicks an element in designer
 *    - Example: TextFieldFormElement.propertiesComponent shows label, placeholder, required toggle
 *
 * ELEMENT LIFECYCLE IN THE BUILDER:
 * 1. Drag form field from sidebar (designerBtnElement with icon/label)
 * 2. Drop onto canvas -> Creates FormElementInstance with construct() method
 * 3. Element renders in designer using designerComponent
 * 4. Click element -> propertiesComponent appears in right sidebar for customization
 * 5. User edits properties -> extraAttributes updated in context
 * 6. On publish -> formComponent used in runtime (public form)
 * 7. User submits -> validate() runs, submitValue() callback fires
 *
 * TYPE SYSTEM:
 * - ElementType: Union of all available field types (currently "TextField", extensible)
 * - FormElementInstance: Individual field instance with id, type, and custom attributes
 * - FormElement: Definition/blueprint for a field type (all 3 components + validation)
 * - FormElementType: Registry mapping ElementType strings to FormElement definitions
 *
 * EXTENSION PATTERN:
 * To add a new field type:
 * 1. Create new file in /fields (e.g., /fields/number-field.tsx)
 * 2. Export a FormElement object with all required properties
 * 3. Add ElementType to the union: export type ElementType = "TextField" | "NumberField"
 * 4. Add to FormElements registry: export const FormElements: FormElementType = { TextField: ..., NumberField: ... }
 *
 * KEY METHODS:
 * - construct(id): Factory function that creates a new FormElementInstance
 * - validate(elementInstance, currentValue): Returns true/false for field validation
 * - submitValue(key, value): Callback to capture field value on form submission
 *
 * ERROR HANDLING:
 * - FormElements is exhaustive type-checked (TypeScript ensures all types are registered)
 * - validate() methods prevent invalid submissions
 * - propertiesComponent can enforce constraints before state update
 */

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
	| "CheckboxField" | "SelectField";

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
		currentValue: string
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
	SelectField: SelectFieldFormElement
};

export type SubmitFunction = (key: string, value: string) => void;

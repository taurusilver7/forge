/**
 * SeparatorField Component - Title Input Form Field
 *
 * PURPOSE:
 * Defines a complete text input field for the form builder system.
 * Implements all three required contexts: Designer (visual builder), Form (runtime), and Properties (editor).
 *
 * STRUCTURE:
 * This file exports ParagraphFieldFormElement, which is a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "separatorField" - Unique identifier for this field type
 *    - extraAttributes: Default configuration (label, placeholder, required, helperText)
 *    - construct(): Factory function that creates new TitleField instances
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Renders in the form builder canvas
 *    - Shows: Label + disabled preview input + helper text
 *    - Displays required indicator (*) when applicable
 *    - Read-only preview (user cannot interact in builder)
 *    - Used to visualize the field during form design
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Renders in published forms and previews
 *    - Interactive input that accepts user data
 *    - Features:
 *      - State management (value, error)
 *      - Real-time validation on blur event
 *      - Error display (red border + red text)
 *      - Placeholder and helper text support
 *      - Calls submitValue() on successful validation
 *    - Used by end-users filling out the form
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Renders in the properties sidebar when field is selected
 *    - React Hook Form for state management
 *    - Zod validation for schema enforcement
 *    - Features:
 *      - Edit label, placeholder, helper text, required flag
 *      - Changes sync back to designer canvas in real-time
 *      - Form reset on element selection change
 *    - Used by form builders customizing field settings
 *
 * 5. VALIDATION LOGIC
 *    - validate(): Checks if field meets constraints
 *    - Returns true if: field is not required OR has non-empty value
 *    - Used by FormComponent on blur and PropertiesComponent schema validation
 *
 * 6. TYPE SAFETY
 *    - CustomInstance: Extends FormElementInstance with typed extraAttributes
 *    - TitleFieldSchema: Zod schema (defined in @/lib/schema) validates all properties
 *
 * DATA FLOW:
 * 1. User drags TitleField from sidebar -> construct() creates instance
 * 2. Instance renders via DesignerComponent in canvas
 * 3. User clicks field -> PropertiesComponent appears in sidebar
 * 4. User edits properties -> updateElement() updates context
 * 5. DesignerComponent re-renders with new config
 * 6. On form publish -> FormComponent replaces DesignerComponent
 * 7. End-user fills form -> FormComponent validates and calls submitValue()
 *
 * ATTRIBUTE SCHEMA:
 * - label: Display label for the field
 * - placeholder: Hint text inside input
 * - required: Boolean - field must have value before submit
 * - helperText: Additional description below input
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
} from "@/components/form-elements";
import { Label } from "@/components/ui/label";
import { RiSeparator } from "react-icons/ri";
import { Separator } from "../ui/separator";

const type: ElementType = "SeparatorField";

export const SeparatorFieldFormElement: FormElement = {
	type,
	construct: (id: string) => ({
		id,
		type,
	}),
	designerBtnElement: {
		icon: RiSeparator,
		label: "Separator Field",
	},
	designerComponent: DesignerComponent,
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,

	validate: () => true,
};

function DesignerComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className="text-muted-foreground">Separator</Label>

			<Separator />
		</div>
	);
}

function FormComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	return <Separator />;
}

function PropertiesComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	return <p>No properties for a line separator</p>;
}

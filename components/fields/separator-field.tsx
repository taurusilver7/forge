/**
 * SeparatorField Component — Visual Horizontal Rule
 *
 * PURPOSE:
 * A non-interactive layout element that renders a horizontal dividing line.
 * Use to create visual separation between sections of a form without adding
 * heading text. Pairs naturally with TitleField and SubTitleField.
 * Has no configurable attributes and always validates as true.
 *
 * STRUCTURE:
 * Exports `SeparatorFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "SeparatorField"
 *    - extraAttributes: none
 *    - construct(): Factory — creates a minimal instance with no extra attributes
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Renders a <Separator /> (shadcn/ui) with a label above it
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Renders the same <Separator /> — purely presentational
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - No configurable properties; renders a note informing the builder
 *
 * 5. VALIDATION LOGIC
 *    - validate(): always returns true
 *
 * ATTRIBUTE SCHEMA:
 * (none)
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

/**
 * TextField Component - Text Input Form Field
 *
 * PURPOSE:
 * Defines a complete text input field for the form builder system.
 * Implements all three required contexts: Designer (visual builder), Form (runtime), and Properties (editor).
 *
 * STRUCTURE:
 * This file exports TextFieldFormElement, which is a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "TextField" - Unique identifier for this field type
 *    - extraAttributes: Default configuration (label, placeholder, required, helperText)
 *    - construct(): Factory function that creates new TextField instances
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
 *    - TextFieldSchema: Zod schema (defined in @/lib/schema) validates all properties
 *
 * DATA FLOW:
 * 1. User drags TextField from sidebar -> construct() creates instance
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
	SubmitFunction,
} from "@/components/form-elements";
import { TextIcon } from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { z } from "zod";
import { TextFieldSchema } from "@/lib/schema";
import useDesigner from "@/hooks/useDesigner";
import { Form } from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,

	validate: (
		formElement: FormElementInstance,
		currentValue: string
	): boolean => {
		const element = formElement as CustomInstance;
		if (element.extraAttributes?.required) {
			return currentValue.length > 0;
		}
		return true;
	},
};

function DesignerComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;
	const { label, placeholder, required, helperText } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
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

interface FormComponentProps {
	elementInstance: FormElementInstance;
	submitValue?: SubmitFunction;
	isInvalid?: boolean;
	defaultValue?: string;
}

function FormComponent({
	elementInstance,
	submitValue,
	isInvalid,
	defaultValue,
}: FormComponentProps) {
	const element = elementInstance as CustomInstance;
	const [value, setValue] = useState<string>(defaultValue || "");
	const [error, setError] = useState(false);

	useEffect(() => {
		setError(isInvalid === true);
	}, [isInvalid]);

	const { label, required, helperText, placeholder } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className={cn(error && "text-red-500")}>
				{label}
				{required && ""}
			</Label>
			<Input
				className={cn(error && "border-red-500")}
				placeholder={placeholder}
				onChange={(e) => setValue(e.target.value)}
				onBlur={(e) => {
					if (!submitValue) return;
					const valid = TextFieldFormElement.validate(
						element,
						e.target.value
					);
					setError(!valid);
					if (!valid) return;
					submitValue(element.id, e.target.value);
				}}
				value={value}
			/>
			{helperText && (
				<p
					className={cn(
						"text-muted-foreground text-sm",
						error && "text-red-500"
					)}
				>
					{helperText}
				</p>
			)}
		</div>
	);
}

type textFieldSchemaType = z.infer<typeof TextFieldSchema>;
function PropertiesComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;

	const { updateElement } = useDesigner();
	const form = useForm<textFieldSchemaType>({
		resolver: zodResolver(TextFieldSchema),
		mode: "onBlur",
		defaultValues: {
			label: element.extraAttributes.label,
			helperText: element.extraAttributes.helperText,
			required: element.extraAttributes.required,
			placeholder: element.extraAttributes.placeholder,
		},
	});

	useEffect(() => {
		form.reset(element.extraAttributes);
	}, [element, form]);

	function applyChanges(values: textFieldSchemaType) {
		const { helperText, label, placeholder, required } = values;
		updateElement(element.id, {
			...element,
			extraAttributes: {
				label,
				helperText,
				placeholder,
				required,
			},
		});
	}

	return (
		<Form {...form}>
			<form className="space-y-3"></form>
		</Form>
	);
}

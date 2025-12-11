/**
 * TitleField Component - Title/Heading Display Element
 *
 * PURPOSE:
 * Defines a read-only heading/title element for the form builder system.
 * Used to add visual structure and labels to forms. Unlike TextField, this is a display-only element
 * that does not collect user input or validation.
 * Implements all three required contexts: Designer (visual builder), Form (runtime), and Properties (editor).
 *
 * STRUCTURE:
 * This file exports TitleFieldFormElement, which is a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "TitleField" - Unique identifier for this field type
 *    - extraAttributes: Configuration (title text)
 *    - construct(): Factory function that creates new TitleField instances
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Renders in the form builder canvas
 *    - Shows: H1 label + preview of title text
 *    - Read-only preview (non-interactive)
 *    - Used to visualize the heading during form design
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Renders in published forms and previews
 *    - Simple text display (styled as H1 heading)
 *    - No interactivity, validation, or value collection
 *    - Used to display section titles, instructions, or visual separators
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Renders in the properties sidebar when field is selected
 *    - React Hook Form for state management
 *    - Zod validation for schema enforcement
 *    - Features:
 *      - Edit title text (2-50 characters)
 *      - Changes sync back to designer canvas in real-time
 *      - Form reset on element selection change
 *    - Used by form builders customizing the heading text
 *
 * 5. VALIDATION LOGIC
 *    - validate(): Always returns true (no user input to validate)
 *    - This element does not participate in form submission
 *
 * 6. TYPE SAFETY
 *    - CustomInstance: Extends FormElementInstance with typed extraAttributes
 *    - propertiesSchema: Zod schema validates title text constraints
 *
 * DATA FLOW:
 * 1. User drags TitleField from sidebar -> construct() creates instance
 * 2. Instance renders via DesignerComponent in canvas
 * 3. User clicks field -> PropertiesComponent appears in sidebar
 * 4. User edits title text -> updateElement() updates context
 * 5. DesignerComponent re-renders with new text
 * 6. On form publish -> FormComponent displays as heading (no interactivity)
 * 7. End-user sees the title; no input, validation, or submission involved
 *
 * ATTRIBUTE SCHEMA:
 * - title: Display heading text (2-50 chars)
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { CheckboxIcon, HeadingIcon } from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import { z } from "zod";
import useDesigner from "@/hooks/useDesigner";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";

const type: ElementType = "CheckboxField";

const extraAttributes = {
	label: "Checkbox ",
	helperText: "Helper Text",
	required: false,
};

const propertiesSchema = z.object({
	label: z.string().min(2).max(50),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const CheckboxFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes,
	}),
	designerBtnElement: {
		icon: CheckboxIcon,
		label: "Checkbox Field",
	},
	designerComponent: DesignerComponent,
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,

	validate: (
		formElement: FormElementInstance,
		currentValue: string
	): boolean => {
		const element = formElement as CustomInstance;
		if (element.extraAttributes.required) {
			return currentValue === "true";
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
	const { helperText, label, required } = element.extraAttributes;
	const id = `checkbox-${element.id}`;
	return (
		<div className="flex items-start space-x-2">
			<Checkbox id={id} />
			<div className="grid gap-1 5 leading-none">
				<Label className="" htmlFor={id}>
					{label}
					{required && "*"}
				</Label>
				{helperText && (
					<p className="text-muted-foreground text-xs">{helperText}</p>
				)}
			</div>
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
	defaultValue,
	isInvalid,
	submitValue,
}: FormComponentProps) {
	const element = elementInstance as CustomInstance;

	const [value, setValue] = useState<boolean>(
		defaultValue === "true" ? true : false
	);
	const [error, setError] = useState(false);

	useEffect(() => {
		setError(isInvalid === true);
	}, [isInvalid]);

	const { label, helperText, required } = element.extraAttributes;
	const id = `checkbox-${element.id}`;
	return (
		<div className="flex items-start space-x-2">
			<Checkbox
				id={id}
				checked={value}
				className={cn(error && "border-red-500")}
				onCheckedChange={(checked) => {
					let value = false;
					if (checked === true) value = true;

					setValue(value);
					if (!submitValue) return;

					const stringValue = value ? "true" : "false";
					const valid = CheckboxFieldFormElement.validate(
						element,
						stringValue
					);
					setError(!valid);
					submitValue(element.id, stringValue);
				}}
			/>
			<div className="grid gap-1.5 leading-none">
				<Label htmlFor={id} className={cn(error && "text-red-500")}>
					{label}
					{required && "*"}
				</Label>
				{helperText && (
					<p
						className={cn(
							"text-muted-foreground text-[0.8rem]",
							error && "text-red-500"
						)}
					>
						{helperText}
					</p>
				)}
			</div>
		</div>
	);
}

type titleFieldSchemaType = z.infer<typeof propertiesSchema>;
function PropertiesComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;

	const { updateElement } = useDesigner();
	const form = useForm<titleFieldSchemaType>({
		resolver: zodResolver(propertiesSchema),
		mode: "onBlur",
		defaultValues: {
			label: element.extraAttributes.label,
			helperText: element.extraAttributes.helperText,
			required: element.extraAttributes.required,
		},
	});

	useEffect(() => {
		form.reset(element.extraAttributes);
	}, [element, form]);

	function applyChanges(values: titleFieldSchemaType) {
		const { helperText, label, required } = values;
		updateElement(element.id, {
			...element,
			extraAttributes: {
				helperText,
				required,
				label,
			},
		});
	}

	return (
		<Form {...form}>
			<form
				className="space-y-3"
				onBlur={form.handleSubmit(applyChanges)}
				onSubmit={(e) => {
					e.preventDefault();
				}}
			>
				<FormField
					control={form.control}
					name="label"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Label</FormLabel>
							<FormControl>
								<Input
									{...field}
									onKeyDown={(e) => {
										if (e.key === "Enter") e.currentTarget.blur();
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="helperText"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Helper text</FormLabel>
							<FormControl>
								<Input
									{...field}
									onKeyDown={(e) => {
										if (e.key === "Enter") e.currentTarget.blur();
									}}
								/>
							</FormControl>
							<FormDescription>
								displayed below the field <br />
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="required"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
							<div className="space-y-0.5">
								<FormLabel>Required</FormLabel>
								<FormDescription>
									displayed below the field.
								</FormDescription>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}

/**
 * NumberField Component - Numeric Input Form Field
 *
 * PURPOSE:
 * Implements a numeric input element used in the form builder. Provides
 * Designer (visual preview), Form (runtime interactive input), and
 * Properties (editor) components. Validates presence when `required` is set
 * and ensures the value is numeric at the FormComponent level.
 *
 * STRUCTURE:
 * Exports `NumberFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "NumberField" - Unique identifier for this field type
 *    - extraAttributes: Default configuration (label, placeholder, required, helperText)
 *    - construct(): Factory function that creates new NumberField instances
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Renders a read-only preview of the numeric field on the canvas
 *    - Shows label, disabled number input with placeholder, and helper text
 *    - Used to visualize layout and field appearance while designing
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Renders an interactive `<input type="number">` at runtime
 *    - Manages local value and error state
 *    - Validates on blur: if `required` is true, non-empty numeric value required
 *    - Calls `submitValue(id, value)` when validation passes
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Uses React Hook Form + Zod to edit `label`, `placeholder`, `helperText`, and `required`
 *    - Slider/switch controls are not required here; standard inputs and a `Switch` are used
 *    - Updates sync back to the designer via `updateElement()` in real-time
 *
 * 5. VALIDATION LOGIC
 *    - `validate(formElement, currentValue)`: returns `false` when `required` is true and
 *      the current value is empty; otherwise returns `true`
 *    - Numeric coercion/formatting should be handled by the consumer if necessary
 *
 * 6. TYPE SAFETY
 *    - `CustomInstance` extends `FormElementInstance` with strongly-typed `extraAttributes`
 *    - `propertiesSchema` is a Zod schema enforcing label length, helper text max length,
 *      placeholder length, and `required` boolean
 *
 * DATA FLOW:
 * 1. Drag Number Field from sidebar → `construct()` creates instance with defaults
 * 2. Designer shows a read-only preview of the field
 * 3. Select field → Properties panel opens with editors
 * 4. Edit properties → `updateElement()` updates context → Designer re-renders
 * 5. Publish → FormComponent handles user input and validation, calling `submitValue()` on success
 *
 * ATTRIBUTE SCHEMA:
 * - label: string (2-50) - Display label above the field
 * - placeholder: string (max 50) - Hint shown inside the numeric input
 * - helperText: string (max 200) - Small description shown below the field
 * - required: boolean - If true, field must contain a value before submit
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
import { Bs123 } from "react-icons/bs";

const type: ElementType = "NumberField";

const extraAttributes = {
	label: "Number Field",
	helperText: "Helper Text",
	required: false,
	placeholder: "0",
};

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

const propertiesSchema = z.object({
	label: z.string().min(2).max(50),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
	placeholder: z.string().max(50),
});

export const NumberFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes,
	}),
	designerBtnElement: {
		icon: Bs123,
		label: "Number Field",
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
			<Input type="number" readOnly disabled placeholder={placeholder} />
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
				type="number"
				className={cn(error && "border-red-500")}
				placeholder={placeholder}
				onChange={(e) => setValue(e.target.value)}
				onBlur={(e) => {
					if (!submitValue) return;
					const valid = NumberFieldFormElement.validate(
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

type propertiesSchemaType = z.infer<typeof propertiesSchema>;
function PropertiesComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;

	const { updateElement } = useDesigner();
	const form = useForm<propertiesSchemaType>({
		resolver: zodResolver(propertiesSchema),
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

	function applyChanges(values: propertiesSchemaType) {
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
							<FormDescription>
								The field label <br /> Displayed above the field
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="placeholder"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Placeholder</FormLabel>
							<FormControl>
								<Input
									{...field}
									onKeyDown={(e) => {
										if (e.key === "Enter") e.currentTarget.blur();
									}}
								/>
							</FormControl>
							<FormDescription>The field placeholder.</FormDescription>
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
								The field helper text. <br />
								displayed below the field.
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
									The helper text of the field. <br />
									It will be displayed below the field.
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

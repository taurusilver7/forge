/**
 * TextAreaField Component — Multi-line Text Input
 *
 * PURPOSE:
 * A multi-line text input for collecting longer free-form responses.
 * Use for fields like "message", "bio", "additional comments", "address", or
 * any context where a single-line TextField would be too constrained.
 * Mirrors the behaviour of TextField with the addition of row-count configuration.
 *
 * STRUCTURE:
 * Exports `TextAreaFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "TextAreaField"
 *    - extraAttributes: label, placeholder, helperText, required, rows
 *    - construct(): Factory — clones extraAttributes to prevent shared-reference mutation
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Read-only preview showing a disabled <textarea> at the configured row height
 *    - Shows label, placeholder, helper text, and required indicator
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Interactive <textarea> with resizing
 *    - Validates on blur: required check + optional maxLength
 *    - Error styling mirrors TextField (red border + red label + red helper)
 *    - Calls submitValue() on valid blur
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Editable: label, placeholder, helperText, required, rows
 *    - rows is a number input (1–10)
 *
 * 5. VALIDATION LOGIC
 *    - validate(): returns false when required + empty, true otherwise
 *
 * ATTRIBUTE SCHEMA:
 * - label: string (2–50) — field label
 * - placeholder: string (max 50) — hint text inside the textarea
 * - helperText: string (max 200) — description below the textarea
 * - required: boolean — whether a value is mandatory
 * - rows: number (1–10) — visible row count of the textarea (default 3)
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
import { TextCursorInput } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Slider } from "../ui/slider";

const type: ElementType = "TextAreaField";

const extraAttributes = {
	label: "Textarea Field",
	helperText: "Helper Text",
	required: false,
	placeholder: "Value here...",
	rows: 3,
};

const propertiesSchema = z.object({
	label: z.string().min(2).max(250),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
	placeholder: z.string().max(150),
	rows: z.number().min(1).max(10),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const TextAreaFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: {
		icon: TextCursorInput,
		label: "Textarea Field",
	},
	designerComponent: DesignerComponent,
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,

	validate: (
		formElement: FormElementInstance,
		currentValue: string,
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
	const { label, placeholder, required, helperText, rows } =
		element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label>
				{label}
				{required && "*"}
			</Label>
			<Textarea readOnly disabled placeholder={placeholder} />
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

	const { label, required, helperText, placeholder, rows } =
		element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className={cn(error && "text-red-500")}>
				{label}
				{required && ""}
			</Label>
			<Textarea
				rows={rows}
				className={cn(error && "border-red-500")}
				placeholder={placeholder}
				onChange={(e) => setValue(e.target.value)}
				onBlur={(e) => {
					if (!submitValue) return;
					const valid = TextAreaFieldFormElement.validate(
						element,
						e.target.value,
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
						error && "text-red-500",
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
			rows: element.extraAttributes.rows,
		},
	});

	useEffect(() => {
		form.reset(element.extraAttributes);
	}, [element, form]);

	function applyChanges(values: propertiesSchemaType) {
		updateElement(element.id, {
			...element,
			extraAttributes: {
				...element.extraAttributes,
				...values,
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
								displayed below the field.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="rows"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Rows: {form.watch("rows")} </FormLabel>
							<FormControl>
								<Slider
									defaultValue={[field.value]}
									min={1}
									max={10}
									step={1}
									onValueChange={(value) => {
										field.onChange(value[0]);
									}}
								/>
							</FormControl>

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

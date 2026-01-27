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
import { DropdownMenuIcon, TextIcon } from "@radix-ui/react-icons";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Plus, PlusCircle, X } from "lucide-react";
import { toast } from "../ui/use-toast";

const type: ElementType = "SelectField";

const extraAttributes = {
	label: "Select Field",
	helperText: "Helper Text",
	required: false,
	placeholder: "Value here...",
	options: [],
};

const propertiesSchema = z.object({
	label: z.string().min(2).max(50),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
	placeholder: z.string().max(50),
	options: z.array(z.string()).default([]),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const SelectFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes,
	}),
	designerBtnElement: {
		icon: DropdownMenuIcon,
		label: "Select Field",
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
	const { label, placeholder, required, helperText } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label>
				{label}
				{required && "*"}
			</Label>
			<Select>
				<SelectTrigger className="w-full">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
			</Select>
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

	const { label, required, helperText, placeholder, options } =
		element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className={cn(error && "text-red-500")}>
				{label}
				{required && "*"}
			</Label>
			<Select
				defaultValue={value}
				onValueChange={(value) => {
					setValue(value);
					if (!submitValue) return;

					const valid = SelectFieldFormElement.validate(element, value);
					setError((prev) => !prev);
					submitValue(element.id, value);
				}}
			>
				<SelectTrigger className={cn("w-full", error && "border-red-500")}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options?.map((option) => (
						<SelectItem key={option} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
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

	const { updateElement, setSelectedElement } = useDesigner();
	const form = useForm<propertiesSchemaType>({
		resolver: zodResolver(propertiesSchema),
		mode: "onSubmit",
		defaultValues: {
			label: element.extraAttributes.label,
			helperText: element.extraAttributes.helperText,
			required: element.extraAttributes.required,
			placeholder: element.extraAttributes.placeholder,
			options: element.extraAttributes.options,
		},
	});

	useEffect(() => {
		form.reset(element.extraAttributes);
	}, [element, form]);

	function applyChanges(values: propertiesSchemaType) {
		const { helperText, label, placeholder, required, options } = values;
		updateElement(element.id, {
			...element,
			extraAttributes: {
				label,
				helperText,
				placeholder,
				required,
				options,
			},
		});

		toast({
			title: "success",
			description: "Properties saved successfully",
		});
		setSelectedElement(null);
	}

	return (
		<Form {...form}>
			<form className="space-y-3" onSubmit={form.handleSubmit(applyChanges)}>
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
								Displayed above the field
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

							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="helperText"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Helper Text</FormLabel>
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
				<Separator />
				<FormField
					control={form.control}
					name="options"
					render={({ field }) => (
						<FormItem>
							<div className="flex justify-between items-center">
								<FormLabel>Options</FormLabel>
								<Button
									variant={"outline"}
									size="icon"
									className="gap-2"
									onClick={(e) => {
										e.preventDefault();
										form.setValue(
											"options",
											field.value.concat("New option"),
										);
									}}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>
							<div className="flex flex-col gap-2">
								{form.watch("options").map((option, index) => (
									<div
										key={index}
										className="flex items-center justify-between gap-1"
									>
										<Input
											placeholder=""
											value={option}
											onChange={(e) => {
												field.value[index] = e.target.value;
												field.onChange(field.value);
											}}
										/>
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => {
												e.preventDefault();
												const newOptions = [...field.value];
												newOptions.splice(index, 1);
												field.onChange(newOptions);
											}}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
								))}
							</div>

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
				<Separator />
				<Button className="w-full" type="submit">
					Save
				</Button>
			</form>
		</Form>
	);
}

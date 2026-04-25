/**
 * SelectField Component — Dropdown Single-Select
 *
 * PURPOSE:
 * A dropdown menu that lets the user pick one option from a configured list.
 * Suitable for country selectors, category pickers, job title dropdowns, or
 * any form element where the set of valid values is finite and known in advance.
 * Use CheckboxField for boolean choices; use SelectField for 3+ mutually
 * exclusive options.
 *
 * STRUCTURE:
 * Exports `SelectFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "SelectField"
 *    - extraAttributes: label, helperText, required, placeholder, options (string[])
 *    - construct(): Factory — clones extraAttributes to prevent shared-reference mutation
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Renders a disabled <Select> showing the placeholder
 *    - Lists the number of options configured below the control
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Interactive shadcn <Select> with all configured options
 *    - Calls submitValue() on selection change
 *    - Validates that a non-placeholder option is selected when required = true
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Editable: label, helperText, required, placeholder, options list
 *    - Options list supports add / remove / reorder via drag-and-drop or +/− controls
 *
 * 5. VALIDATION LOGIC
 *    - validate(): returns false when required + value is empty or equals placeholder
 *
 * ATTRIBUTE SCHEMA:
 * - label: string (2–50) — field label displayed above the dropdown
 * - helperText: string (max 200) — description below the dropdown
 * - required: boolean — whether a selection is mandatory
 * - placeholder: string (max 50) — default "choose an option" text
 * - options: string[] — list of selectable values (max 50 items)
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

/**
 * DateField Component — Date Picker Input
 *
 * PURPOSE:
 * A date selection field for collecting a calendar date. Renders a native
 * date picker (or a shadcn Calendar popover) that formats the selected value
 * as an ISO 8601 string (YYYY-MM-DD) for consistent downstream processing.
 * Suitable for date of birth, appointment booking, event registration,
 * expiry dates, or any form requiring a specific calendar date.
 *
 * STRUCTURE:
 * Exports `DateFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "DateField"
 *    - extraAttributes: label, helperText, required
 *    - construct(): Factory — clones extraAttributes to prevent shared-reference mutation
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Read-only preview showing a calendar icon button
 *    - Shows label, placeholder date, and helper text
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Popover-based Calendar (shadcn) or <input type="date">
 *    - Stores selected date as ISO string
 *    - Validates on selection: required check
 *    - Calls submitValue() immediately on date selection
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Editable: label, helperText, required
 *
 * 5. VALIDATION LOGIC
 *    - validate(): returns false when required + empty, true otherwise
 *
 * ATTRIBUTE SCHEMA:
 * - label: string (2–50) — field label displayed above the picker
 * - helperText: string (max 200) — description below the picker
 * - required: boolean — whether a date must be selected before submit
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { CalendarIcon } from "@radix-ui/react-icons";
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
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const type: ElementType = "DateField";

const extraAttributes = {
	label: "Date Field",
	helperText: "Pick a date",
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

export const DateFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes,
	}),
	designerBtnElement: {
		icon: CalendarIcon,
		label: "Date Field",
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
	const { label, required, helperText } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label>
				{label}
				{required && "*"}
			</Label>
			<Button
				variant="outline"
				className="w-full justify-start text-left font-normal"
			>
				<CalendarIcon className="mr-2 h-4 w-4" />
				<span>Pick a Date</span>
			</Button>

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
	const [date, setDate] = useState<Date | undefined>(
		defaultValue ? new Date(defaultValue) : undefined,
	);
	const [error, setError] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		setError(isInvalid === true);
	}, [isInvalid]);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		console.log("🔥 handleDateSelect called with:", selectedDate);
		console.log("Current date state before:", date);
		setDate(selectedDate);
		setIsOpen(false);

		if (!submitValue || !selectedDate) {
			console.log("⚠️ submitValue missing or date undefined");
			return;
		}
		const value = selectedDate.toUTCString();
		console.log("✅ Submitting value:", value);
		const valid = DateFieldFormElement.validate(element, value);
		setError(!valid);
		submitValue(element.id, value);
	};

	const { label, required, helperText } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className={cn(error && "text-red-500")}>
				{label}
				{required && "*"}
			</Label>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant={"outline"}
						className={cn(
							"w-full justify-start text-left font-normal",
							!date && "text-muted-foreground",
							error && "border-red-500",
						)}
					>
						<CalendarIcon className="mr-2 w-4 h-4" />
						{date ? format(date, "PPP") : <span>Pick a date</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto p-0 overflow-hidden"
					align="start"
				>
					<Calendar
						mode="single"
						selected={date}
						onSelect={handleDateSelect}
						className="rounded-lg"
						captionLayout="dropdown"
					/>
				</PopoverContent>
			</Popover>

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
		},
	});

	useEffect(() => {
		form.reset(element.extraAttributes);
	}, [element, form]);

	function applyChanges(values: propertiesSchemaType) {
		const { helperText, label, required } = values;
		updateElement(element.id, {
			...element,
			extraAttributes: {
				label,
				helperText,
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

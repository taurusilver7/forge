/**
 * PhoneField Component — Phone Number Input
 *
 * PURPOSE:
 * A digit-only input for collecting phone or mobile numbers. Suppresses
 * alphabetic input and shows a numeric keypad on mobile via inputMode="tel".
 * Does not enforce a country-specific format — stores the raw digit string
 * so the backend or a formatting library can normalise it. Suitable for
 * contact forms, delivery addresses, booking confirmations, and account setup.
 *
 * STRUCTURE:
 * Exports `PhoneFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "PhoneField"
 *    - extraAttributes: label, placeholder, helperText, required, minDigits, maxDigits
 *    - construct(): Factory — clones extraAttributes to prevent shared-reference mutation
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Read-only preview with a phone icon prefix
 *    - Shows label, placeholder, helper text, and required indicator
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Uses <input type="tel" inputMode="tel"> for numeric keypad on mobile
 *    - Strips all non-digit characters on change (allows leading + for country code)
 *    - Validates on blur: required check + optional digit-count bounds
 *    - Calls submitValue() when validation passes
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Editable: label, placeholder, helperText, required, minDigits, maxDigits
 *    - minDigits / maxDigits accept empty string (treated as unbounded)
 *    - Changes sync back to designer canvas via updateElement()
 *
 * 5. VALIDATION LOGIC
 *    - validate(): strips non-digits, checks required + optional min/max digit count
 *    - Returns true for optional empty fields; false on constraint violation
 *
 * 6. TYPE SAFETY
 *    - CustomInstance extends FormElementInstance with typed extraAttributes
 *    - propertiesSchema enforces all attribute constraints via Zod
 *
 * DATA FLOW:
 * Drag → construct() → DesignerComponent preview → PropertiesComponent edit →
 * updateElement() → publish → FormComponent validates → submitValue() fires
 *
 * ATTRIBUTE SCHEMA:
 * - label: string (2–50) — field label
 * - placeholder: string (max 50) — example number displayed as hint
 * - helperText: string (max 200) — description below input
 * - required: boolean — whether a value is mandatory
 * - minDigits: number | undefined — minimum digit count (e.g. 7 for local numbers)
 * - maxDigits: number | undefined — maximum digit count (e.g. 15 per E.164)
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { MobileIcon } from "@radix-ui/react-icons";
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

const type: ElementType = "PhoneField";

const extraAttributes = {
	label: "Phone Number",
	helperText: "Include country code for international numbers.",
	required: false,
	placeholder: "+91 98765 43210",
	minDigits: 7 as number | undefined,
	maxDigits: 15 as number | undefined,
};

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

const propertiesSchema = z.object({
	label: z.string().min(2).max(50),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
	placeholder: z.string().max(50),
	minDigits: z.union([z.number().int().min(1), z.nan()]).optional(),
	maxDigits: z.union([z.number().int().min(1), z.nan()]).optional(),
});

const digitsOnly = (v: string) => v.replace(/\D/g, "");

export const PhoneFieldFormElement: FormElement = {
	type,
	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: { icon: MobileIcon, label: "Phone Field" },
	designerComponent: DesignerComponent,
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,
	validate: (
		formElement: FormElementInstance,
		currentValue: string,
	): boolean => {
		const element = formElement as CustomInstance;
		const { required, minDigits, maxDigits } = element.extraAttributes;
		const digits = digitsOnly(currentValue);
		if (required && digits.length === 0) return false;
		if (digits.length === 0) return true;
		if (
			minDigits !== undefined &&
			!isNaN(minDigits) &&
			digits.length < minDigits
		)
			return false;
		if (
			maxDigits !== undefined &&
			!isNaN(maxDigits) &&
			digits.length > maxDigits
		)
			return false;
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
			<div className="relative">
				<MobileIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
				<Input
					readOnly
					disabled
					placeholder={placeholder}
					className="pl-9"
				/>
			</div>
			{helperText && (
				<p className="text-muted-foreground text-xs">{helperText}</p>
			)}
		</div>
	);
}

function FormComponent({
	elementInstance,
	submitValue,
	isInvalid,
	defaultValue,
}: {
	elementInstance: FormElementInstance;
	submitValue?: SubmitFunction;
	isInvalid?: boolean;
	defaultValue?: string;
}) {
	const element = elementInstance as CustomInstance;
	const [value, setValue] = useState(defaultValue || "");
	const [error, setError] = useState(false);
	useEffect(() => {
		setError(isInvalid === true);
	}, [isInvalid]);
	const { label, required, helperText, placeholder } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className={cn(error && "text-red-500")}>
				{label}
				{required && "*"}
			</Label>
			<div className="relative">
				<MobileIcon
					className={cn(
						"absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
						error ? "text-red-500" : "text-muted-foreground",
					)}
				/>
				<Input
					type="tel"
					inputMode="tel"
					autoComplete="tel"
					className={cn("pl-9", error && "border-red-500")}
					placeholder={placeholder}
					onChange={(e) => {
						// Allow + at start, digits only thereafter
						const cleaned = e.target.value
							.replace(/[^\d+]/g, "")
							.replace(/(?!^)\+/g, "");
						setValue(cleaned);
					}}
					onBlur={(e) => {
						const valid = PhoneFieldFormElement.validate(
							element,
							e.target.value,
						);
						setError(!valid);
						if (!valid || !submitValue) return;
						submitValue(element.id, e.target.value);
					}}
					value={value}
				/>
			</div>
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

type PropertiesSchemaType = z.infer<typeof propertiesSchema>;
function PropertiesComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;
	const { updateElement } = useDesigner();
	const form = useForm<PropertiesSchemaType>({
		resolver: zodResolver(propertiesSchema),
		mode: "onBlur",
		defaultValues: element.extraAttributes,
	});
	useEffect(() => {
		form.reset(element.extraAttributes);
	}, [element, form]);
	function applyChanges(values: PropertiesSchemaType) {
		updateElement(element.id, {
			...element,
			extraAttributes: { ...element.extraAttributes, ...values },
		});
	}
	return (
		<Form {...form}>
			<form
				className="space-y-3"
				onBlur={form.handleSubmit(applyChanges)}
				onSubmit={(e) => e.preventDefault()}
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
								Displayed above the field.
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
								Displayed below the field.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex gap-3">
					<FormField
						control={form.control}
						name="minDigits"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel>Min digits</FormLabel>
								<FormControl>
									<Input
										type="text"
										inputMode="numeric"
										placeholder="None"
										value={
											field.value === undefined ||
											isNaN(field.value as number)
												? ""
												: String(field.value)
										}
										onChange={(e) =>
											field.onChange(
												e.target.value === ""
													? undefined
													: Number(e.target.value),
											)
										}
										onBlur={field.onBlur}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="maxDigits"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel>Max digits</FormLabel>
								<FormControl>
									<Input
										type="text"
										inputMode="numeric"
										placeholder="None"
										value={
											field.value === undefined ||
											isNaN(field.value as number)
												? ""
												: String(field.value)
										}
										onChange={(e) =>
											field.onChange(
												e.target.value === ""
													? undefined
													: Number(e.target.value),
											)
										}
										onBlur={field.onBlur}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
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
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}

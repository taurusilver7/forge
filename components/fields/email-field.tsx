/**
 * EmailField Component — Email Address Input
 *
 * PURPOSE:
 * A specialised text input for collecting email addresses. Validates against
 * a standard email pattern on blur and provides appropriate keyboard hints
 * on mobile devices via inputMode="email". Intended for contact forms,
 * newsletter signups, account creation, or any form collecting an address.
 *
 * STRUCTURE:
 * Exports `EmailFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "EmailField"
 *    - extraAttributes: label, placeholder, helperText, required
 *    - construct(): Factory — clones extraAttributes to prevent shared-reference mutation
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Read-only preview with an envelope icon prefix and disabled input
 *    - Shows label, placeholder, helper text, and required indicator
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Uses <input type="email" inputMode="email"> for correct mobile keyboard
 *    - Validates email format on blur using a standard RFC-5322 simplified pattern
 *    - Displays red border + red label + red helper text on validation failure
 *    - Calls submitValue() when format passes and required check passes
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Editable: label, placeholder, helperText, required
 *    - Uses React Hook Form + Zod for validation and blur-triggered persistence
 *    - Changes sync back to designer canvas in real-time via updateElement()
 *
 * 5. VALIDATION LOGIC
 *    - validate(): returns false when required + empty, or when value is present
 *      but does not match the email pattern
 *    - Returns true when field is not required and value is empty (optional field)
 *
 * 6. TYPE SAFETY
 *    - CustomInstance extends FormElementInstance with typed extraAttributes
 *    - propertiesSchema enforces attribute constraints via Zod
 *
 * DATA FLOW:
 * Drag → construct() → DesignerComponent preview → PropertiesComponent edit →
 * updateElement() → publish → FormComponent validates → submitValue() fires
 *
 * ATTRIBUTE SCHEMA:
 * - label: string (2–50) — field label displayed above input
 * - placeholder: string (max 50) — example address shown as hint
 * - helperText: string (max 200) — description below input
 * - required: boolean — whether a value is mandatory before submit
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";
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

const type: ElementType = "EmailField";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const extraAttributes = {
	label: "Email",
	helperText: "We'll never share your email.",
	required: false,
	placeholder: "you@example.com",
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

export const EmailFieldFormElement: FormElement = {
	type,
	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: { icon: EnvelopeClosedIcon, label: "Email Field" },
	designerComponent: DesignerComponent,
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,
	validate: (
		formElement: FormElementInstance,
		currentValue: string,
	): boolean => {
		const element = formElement as CustomInstance;
		if (element.extraAttributes.required && currentValue.trim().length === 0)
			return false;
		if (
			currentValue.trim().length > 0 &&
			!EMAIL_PATTERN.test(currentValue.trim())
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
				<EnvelopeClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
				<EnvelopeClosedIcon
					className={cn(
						"absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
						error ? "text-red-500" : "text-muted-foreground",
					)}
				/>
				<Input
					type="email"
					inputMode="email"
					autoComplete="email"
					className={cn("pl-9", error && "border-red-500")}
					placeholder={placeholder}
					onChange={(e) => setValue(e.target.value)}
					onBlur={(e) => {
						const valid = EmailFieldFormElement.validate(
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

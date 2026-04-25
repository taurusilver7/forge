/**
 * SliderField Component — Range Slider Input
 *
 * PURPOSE:
 * A draggable range slider for collecting a numeric value within a defined
 * min–max range. Ideal for surveys (satisfaction scores, likelihood to
 * recommend), configuration UIs (budget sliders, priority levels), and
 * any form where the user benefits from seeing their value in relative
 * context rather than typing a bare number.
 *
 * STRUCTURE:
 * Exports `SliderFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "SliderField"
 *    - extraAttributes: label, helperText, required, min, max, step, defaultValue
 *    - construct(): Factory — clones extraAttributes to prevent shared-reference mutation
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Shows a read-only disabled range input at the defaultValue position
 *    - Displays min/max labels beneath the track and the current value
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Interactive <input type="range"> with live value readout
 *    - Calls submitValue() on every change (sliders have no blur event pattern)
 *    - Validates that a value is present when required = true
 *    - Displays error state on label and value readout
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Editable: label, helperText, required, min, max, step
 *    - min/max/step use numeric text inputs (no spinners)
 *    - Changes sync back to designer canvas via updateElement()
 *
 * 5. VALIDATION LOGIC
 *    - validate(): range sliders always have a numeric value (HTML default = midpoint)
 *    - When required = true, returns false only if currentValue is empty or NaN
 *    - Returns true in all other cases (slider inherently produces a value)
 *
 * 6. TYPE SAFETY
 *    - CustomInstance extends FormElementInstance with typed extraAttributes
 *    - propertiesSchema enforces attribute constraints via Zod
 *
 * DATA FLOW:
 * Drag → construct() → DesignerComponent preview → PropertiesComponent edit →
 * updateElement() → publish → FormComponent drag → submitValue() fires on change
 *
 * ATTRIBUTE SCHEMA:
 * - label: string (2–50) — field label displayed above the slider
 * - helperText: string (max 200) — description below the slider
 * - required: boolean — whether a value must be explicitly set before submit
 * - min: number — lower bound of the range (default 0)
 * - max: number — upper bound of the range (default 100)
 * - step: number — increment between selectable values (default 1)
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { SizeIcon } from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";
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
import { Input } from "../ui/input";

const type: ElementType = "SliderField";

const extraAttributes = {
	label: "Slider",
	helperText: "Drag to select a value.",
	required: false,
	min: 0,
	max: 100,
	step: 1,
};

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

const propertiesSchema = z.object({
	label: z.string().min(2).max(50),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
	min: z.number().default(0),
	max: z.number().default(100),
	step: z.number().min(0.01).default(1),
});

export const SliderFieldFormElement: FormElement = {
	type,
	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: { icon: SizeIcon, label: "Slider Field" },
	designerComponent: DesignerComponent,
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,
	validate: (
		formElement: FormElementInstance,
		currentValue: string,
	): boolean => {
		const element = formElement as CustomInstance;
		if (element.extraAttributes.required) {
			return currentValue.trim().length > 0 && !isNaN(Number(currentValue));
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
	const { label, helperText, required, min, max, step } =
		element.extraAttributes;
	const mid = Math.round((min + max) / 2);
	return (
		<div className="flex flex-col gap-2 w-full">
			<div className="flex justify-between items-center">
				<Label>
					{label}
					{required && "*"}
				</Label>
				<span className="text-sm font-medium text-muted-foreground">
					{mid}
				</span>
			</div>
			<input
				type="range"
				disabled
				min={min}
				max={max}
				step={step}
				defaultValue={mid}
				className="w-full accent-primary"
			/>
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>{min}</span>
				<span>{max}</span>
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
	const { label, required, helperText, min, max, step } =
		element.extraAttributes;
	const initialValue = defaultValue
		? Number(defaultValue)
		: Math.round((min + max) / 2);
	const [value, setValue] = useState(initialValue);
	const [error, setError] = useState(false);
	useEffect(() => {
		setError(isInvalid === true);
	}, [isInvalid]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const num = Number(e.target.value);
		setValue(num);
		const valid = SliderFieldFormElement.validate(element, String(num));
		setError(!valid);
		submitValue?.(element.id, String(num));
	};

	return (
		<div className="flex flex-col gap-2 w-full">
			<div className="flex justify-between items-center">
				<Label className={cn(error && "text-red-500")}>
					{label}
					{required && "*"}
				</Label>
				<span
					className={cn(
						"text-sm font-medium",
						error ? "text-red-500" : "text-foreground",
					)}
				>
					{value}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={handleChange}
				className={cn("w-full accent-primary", error && "accent-red-500")}
			/>
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>{min}</span>
				<span>{max}</span>
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
	const numField = (
		name: "min" | "max" | "step",
		label: string,
		desc?: string,
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex-1">
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<Input
							type="text"
							inputMode="numeric"
							placeholder="0"
							value={field.value}
							onChange={(e) => field.onChange(Number(e.target.value))}
							onBlur={field.onBlur}
						/>
					</FormControl>
					{desc && <FormDescription>{desc}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
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
								Displayed above the slider.
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
								Displayed below the slider.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex gap-3">
					{numField("min", "Min")}
					{numField("max", "Max")}
					{numField("step", "Step")}
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

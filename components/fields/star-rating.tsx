/**
 * RatingField Component — Star Rating Input
 *
 * PURPOSE:
 * A visual star-based rating selector for collecting qualitative scores.
 * Suitable for product reviews, post-event feedback, NPS-style surveys,
 * customer satisfaction forms, and any context where a 1–N numeric opinion
 * is easier to express as stars than as a typed number.
 *
 * STRUCTURE:
 * Exports `RatingFieldFormElement`, a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "RatingField"
 *    - extraAttributes: label, helperText, required, maxStars (1–10, default 5), defaultValue
 *    - construct(): Factory — clones extraAttributes to prevent shared-reference mutation
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Shows a static row of hollow star icons to preview field appearance
 *    - Renders label, star count preview, and helper text
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Interactive star row: hover highlights, click to select a rating
 *    - Hover preview shows potential rating without committing (fills stars on hover)
 *    - Clicking the already-selected star deselects it (returns to 0 / unrated)
 *    - Calls submitValue() immediately on every click (no blur required)
 *    - Validates that a rating has been selected when required = true
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Editable: label, helperText, required, maxStars
 *    - maxStars is a number input clamped to 1–10
 *    - Changes sync back to designer canvas via updateElement()
 *
 * 5. VALIDATION LOGIC
 *    - validate(): currentValue is stored as "0"–"N" string
 *    - Returns false when required = true and value is "0" or empty
 *    - Returns true in all other cases
 *
 * 6. TYPE SAFETY
 *    - CustomInstance extends FormElementInstance with typed extraAttributes
 *    - propertiesSchema enforces attribute constraints via Zod
 *
 * DATA FLOW:
 * Drag → construct() → DesignerComponent preview → PropertiesComponent edit →
 * updateElement() → publish → FormComponent click → submitValue() fires
 *
 * ATTRIBUTE SCHEMA:
 * - label: string (2–50) — field label displayed above stars
 * - helperText: string (max 200) — description below the star row
 * - required: boolean — whether a rating must be selected before submit
 * - maxStars: number (1–10) — total number of stars rendered (default 5)
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { StarIcon } from "@radix-ui/react-icons";
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
import { Star } from "lucide-react";

const type: ElementType = "RatingField";

const extraAttributes = {
	label: "Rate your experience",
	helperText: "Tap a star to rate.",
	required: false,
	maxStars: 5,
};

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

const propertiesSchema = z.object({
	label: z.string().min(2).max(50),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
	maxStars: z.number().int().min(1).max(10).default(5),
});

export const RatingFieldFormElement: FormElement = {
	type,
	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: { icon: StarIcon, label: "Rating Field" },
	designerComponent: DesignerComponent,
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,
	validate: (
		formElement: FormElementInstance,
		currentValue: string,
	): boolean => {
		const element = formElement as CustomInstance;
		if (element.extraAttributes.required) {
			return parseInt(currentValue, 10) > 0;
		}
		return true;
	},
};

function StarRow({
	count,
	filled,
	hovered,
	onHover,
	onClick,
	error,
}: {
	count: number;
	filled: number;
	hovered: number;
	onHover?: (n: number) => void;
	onClick?: (n: number) => void;
	error?: boolean;
}) {
	return (
		<div className="flex gap-1">
			{Array.from({ length: count }, (_, i) => i + 1).map((n) => {
				const active = hovered > 0 ? n <= hovered : n <= filled;
				return (
					<button
						key={n}
						type="button"
						className={cn(
							"w-8 h-8 transition-colors",
							active
								? error
									? "text-red-500"
									: "text-yellow-400"
								: "text-muted-foreground/30",
							onHover && "cursor-pointer hover:scale-110",
						)}
						onMouseEnter={() => onHover?.(n)}
						onMouseLeave={() => onHover?.(0)}
						onClick={() => onClick?.(n)}
						aria-label={`Rate ${n} out of ${count}`}
					>
						<Star
							className={cn(
								"w-full h-full",
								error && "fill-red-500",
								active && "fill-yellow-400",
							)}
						/>
					</button>
				);
			})}
		</div>
	);
}

function DesignerComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;
	const { label, helperText, required, maxStars } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label>
				{label}
				{required && "*"}
			</Label>
			<StarRow count={maxStars} filled={0} hovered={0} />
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
	const { label, required, helperText, maxStars } = element.extraAttributes;
	const [rating, setRating] = useState(parseInt(defaultValue || "0", 10));
	const [hovered, setHovered] = useState(0);
	const [error, setError] = useState(false);
	useEffect(() => {
		setError(isInvalid === true);
	}, [isInvalid]);

	const handleClick = (n: number) => {
		const next = n === rating ? 0 : n;
		setRating(next);
		const stringVal = String(next);
		const valid = RatingFieldFormElement.validate(element, stringVal);
		setError(!valid);
		submitValue?.(element.id, stringVal);
	};

	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className={cn(error && "text-red-500")}>
				{label}
				{required && "*"}
			</Label>
			<StarRow
				count={maxStars}
				filled={rating}
				hovered={hovered}
				onHover={setHovered}
				onClick={handleClick}
				error={error}
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
								Question shown above the stars.
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
								Displayed below the stars.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="maxStars"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Number of stars</FormLabel>
							<FormControl>
								<Input
									type="text"
									inputMode="numeric"
									placeholder="5"
									value={field.value}
									onChange={(e) =>
										field.onChange(
											Math.min(
												10,
												Math.max(1, Number(e.target.value) || 5),
											),
										)
									}
									onBlur={field.onBlur}
								/>
							</FormControl>
							<FormDescription>
								How many stars to display (1–10).
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
									User must select at least one star.
								</FormDescription>
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

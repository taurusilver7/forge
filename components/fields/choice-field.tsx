"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { ListOrdered } from "lucide-react";
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
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Plus, X } from "lucide-react";

const type: ElementType = "ChoiceField";

const extraAttributes = {
	label: "Choice Field",
	helperText: "Helper Text",
	required: false,
	placeholder: "Type your answer",
	options: [] as string[],
	allowOther: false,
};

const propertiesSchema = z.object({
	label: z.string().min(2).max(250),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
	placeholder: z.string().max(150),
	options: z.array(z.string()).default([]),
	allowOther: z.boolean().default(false),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ChoiceFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes, options: [] },
	}),
	designerBtnElement: {
		icon: ListOrdered,
		label: "Choice Field",
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
	const { label, required, helperText, options, allowOther } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label>
				{label}
				{required && "*"}
			</Label>
			<div className="flex flex-col gap-1.5">
				{options.map((opt, i) => (
					<div
						key={i}
						className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background text-sm"
					>
						<span className="text-muted-foreground text-xs font-semibold w-5 shrink-0">
							{letters[i % 26]}.
						</span>
						{opt}
					</div>
				))}
				{allowOther && (
					<div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background text-sm text-muted-foreground">
						<span className="text-xs font-semibold w-5 shrink-0">
							{letters[options.length % 26]}.
						</span>
						Other
					</div>
				)}
				{options.length === 0 && !allowOther && (
					<p className="text-xs text-muted-foreground">No options configured</p>
				)}
			</div>
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
	const [selected, setSelected] = useState<string>(defaultValue || "");
	const [otherText, setOtherText] = useState("");
	const [error, setError] = useState(false);

	useEffect(() => {
		setError(isInvalid === true);
	}, [isInvalid]);

	const { label, required, helperText, placeholder, options, allowOther } =
		element.extraAttributes;

	const isOtherSelected = allowOther && selected === "__other__";

	const emitValue = (val: string) => {
		if (!submitValue) return;
		const valid = ChoiceFieldFormElement.validate(element, val);
		setError(!valid);
		submitValue(element.id, val);
	};

	const handleSelect = (opt: string) => {
		setSelected(opt);
		setError(false);
		if (opt !== "__other__") {
			emitValue(opt);
		} else {
			emitValue(otherText || "");
		}
	};

	const handleOtherChange = (val: string) => {
		setOtherText(val);
		setError(false);
		emitValue(val);
	};

	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className={cn(error && "text-red-500")}>
				{label}
				{required && "*"}
			</Label>
			<div className="flex flex-col gap-1.5">
				{options.map((opt, i) => {
					const isActive = selected === opt;
					return (
						<button
							key={i}
							type="button"
							onClick={() => handleSelect(opt)}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition-colors cursor-pointer",
								isActive
									? "border-primary bg-primary/10 text-primary"
									: "border-border bg-background hover:border-primary/50",
								error && "border-red-500",
							)}
						>
							<span
								className={cn(
									"text-xs font-semibold w-5 shrink-0",
									isActive ? "text-primary" : "text-muted-foreground",
								)}
							>
								{letters[i % 26]}.
							</span>
							{opt}
						</button>
					);
				})}
				{allowOther && (
					<>
						<button
							type="button"
							onClick={() => handleSelect("__other__")}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition-colors cursor-pointer",
								isOtherSelected
									? "border-primary bg-primary/10 text-primary"
									: "border-border bg-background hover:border-primary/50",
							)}
						>
							<span
								className={cn(
									"text-xs font-semibold w-5 shrink-0",
									isOtherSelected ? "text-primary" : "text-muted-foreground",
								)}
							>
								{letters[options.length % 26]}.
							</span>
							Other
						</button>
						{isOtherSelected && (
							<Input
								placeholder={placeholder}
								value={otherText}
								onChange={(e) => handleOtherChange(e.target.value)}
								className={cn(error && "border-red-500")}
								autoFocus
							/>
						)}
					</>
				)}
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
			options: element.extraAttributes.options,
			allowOther: element.extraAttributes.allowOther,
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
							<FormDescription>
								Placeholder for the "Other" input
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
				<FormField
					control={form.control}
					name="allowOther"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
							<div className="space-y-0.5">
								<FormLabel>Allow "Other"</FormLabel>
								<FormDescription>
									Adds an "Other" option with a custom text input
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
// ponytail: letters array caps at 26 options; extend if >26 needed

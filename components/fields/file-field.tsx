"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { FileUp } from "lucide-react";
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

const type: ElementType = "FileField";

const extraAttributes = {
	label: "File",
	helperText: "",
	required: false,
};

const propertiesSchema = z.object({
	label: z.string().min(1).max(50),
	helperText: z.string().max(200),
	required: z.boolean().default(false),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const FileFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: {
		icon: FileUp,
		label: "File",
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
			<Input type="file" disabled />
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
	const [fileName, setFileName] = useState<string>(defaultValue || "");
	const [error, setError] = useState(false);

	useEffect(() => {
		setError(isInvalid === true);
	}, [isInvalid]);

	const { label, required, helperText } = element.extraAttributes;

	const handleFile = (name: string) => {
		// ponytail: name-only capture; wire a real upload backend to store bytes later
		setFileName(name);
		setError(false);
		if (!submitValue) return;
		const valid = FileFieldFormElement.validate(element, name);
		setError(!valid);
		submitValue(element.id, name);
	};

	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className={cn(error && "text-red-500")}>
				{label}
				{required && "*"}
			</Label>
			<Input
				type="file"
				className={cn(error && "border-red-500")}
				onChange={(e) => handleFile(e.target.files?.[0]?.name ?? "")}
			/>
			{fileName && (
				<p className="text-muted-foreground text-xs">Selected: {fileName}</p>
			)}
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

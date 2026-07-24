"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { Heading2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { z } from "zod";
import useDesigner from "@/hooks/useDesigner";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const type: ElementType = "SubTitleField";

const extraAttributes = {
	title: "Text Here",
};

const propertiesSchema = z.object({
	title: z.string().min(2).max(250),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const SubTitleFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: {
		icon: Heading2,
		label: "Subtitle Field",
	},
	designerComponent: DesignerComponent,
	formComponent: FormComponent,
	propertiesComponent: PropertiesComponent,

	validate: () => true,
};

function DesignerComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;
	const { title } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className="flex flex-col gap-2 w-full">H2 Heading</Label>

			<p className="text-lg">{title}</p>
		</div>
	);
}

interface FormComponentProps {
	elementInstance: FormElementInstance;
	submitValue?: SubmitFunction;
	isInvalid?: boolean;
	defaultValue?: string;
}

function FormComponent({ elementInstance }: FormComponentProps) {
	const element = elementInstance as CustomInstance;

	const { title } = element.extraAttributes;
	return <p className="text-lg">{title}</p>;
}

type titleFieldSchemaType = z.infer<typeof propertiesSchema>;
function PropertiesComponent({
	elementInstance,
}: {
	elementInstance: FormElementInstance;
}) {
	const element = elementInstance as CustomInstance;

	const { updateElement } = useDesigner();
	const form = useForm<titleFieldSchemaType>({
		resolver: zodResolver(propertiesSchema),
		mode: "onBlur",
		defaultValues: {
			title: element.extraAttributes.title,
		},
	});

	useEffect(() => {
		form.reset(element.extraAttributes);
	}, [element, form]);

	function applyChanges(values: titleFieldSchemaType) {
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
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>H2 Heading</FormLabel>
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
			</form>
		</Form>
	);
}

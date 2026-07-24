"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { HeadingIcon } from "@radix-ui/react-icons";
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


const type: ElementType = "TitleField";

const extraAttributes = {
	title: "Text Here",
};

const propertiesSchema = z.object({
	title: z.string().min(2).max(250),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const TitleFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: {
		icon: HeadingIcon,
		label: "Title Field",
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
			<Label className="flex flex-col gap-2 w-full">H1 Heading</Label>

			<p className="text-xl">{title}</p>
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
	return <p className="text-xl">{title}</p>;
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
							<FormLabel>Hi Heading</FormLabel>
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

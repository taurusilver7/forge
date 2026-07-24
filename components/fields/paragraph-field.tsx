"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { Label } from "@/components/ui/label";
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
import { Text } from "lucide-react";
import { Textarea } from "../ui/textarea";

const type: ElementType = "ParagraphField";

const extraAttributes = {
	text: "Text Here",
};

const propertiesSchema = z.object({
	text: z.string().min(2).max(500),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const ParagraphFieldFormElement: FormElement = {
	type,
	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: {
		icon: Text,
		label: "Paragraph Field",
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
	const { text } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full">
			<Label className="text-muted-foreground">Paragraph</Label>

			<p className="text-md truncate">{text}</p>
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

	const { text } = element.extraAttributes;
	return <p className="text-md text-muted-foreground">{text}</p>;
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
			text: element.extraAttributes.text,
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
					name="text"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Paragraph</FormLabel>
							<FormControl>
								<Textarea
									rows={5}
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

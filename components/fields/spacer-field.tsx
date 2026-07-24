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
import { SeparatorHorizontal } from "lucide-react";
import { Slider } from "../ui/slider";
import { SpaceBetweenVerticallyIcon } from "@radix-ui/react-icons";

const type: ElementType = "SpacerField";

const extraAttributes = {
	height: 20, //px
};

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

const propertiesSchema = z.object({
	height: z.number().min(5).max(200),
});

export const SpacerFieldFormElement: FormElement = {
	type,
	construct: (id: string) => ({
		id,
		type,
		extraAttributes: { ...extraAttributes },
	}),
	designerBtnElement: {
		icon: SpaceBetweenVerticallyIcon,
		label: "Spacer Field",
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
	const { height } = element.extraAttributes;
	return (
		<div className="flex flex-col gap-2 w-full items-center">
			<Label className="flex flex-col gap-2 w-full">
				Spacing: {height}px
			</Label>
			<SeparatorHorizontal className="h-8 w-8" />
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

	const { height } = element.extraAttributes;
	return <div style={{ height, width: "100%" }} />;
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
			height: element.extraAttributes.height,
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
					name="height"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Height(px): {form.watch("height")}px</FormLabel>
							<FormControl>
								<Slider
									defaultValue={[field.value]}
									min={5}
									max={200}
									step={1}
									onValueChange={(value) => {
										field.onChange(value[0]);
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

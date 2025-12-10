/**
 * SpacerField Component - Vertical Spacing Display Element
 *
 * PURPOSE:
 * Defines a spacing element that adds vertical whitespace to forms.
 * Implements all three required contexts: Designer (visual builder), Form (runtime), and Properties (editor).
 * Non-interactive display-only element; does not collect user input or validation.
 *
 * STRUCTURE:
 * This file exports SpacerFieldFormElement, which is a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "SpacerField" - Unique identifier for this field type
 *    - extraAttributes: Default configuration (height: 20px)
 *    - construct(): Factory function that creates new SpacerField instances
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Renders in the form builder canvas
 *    - Shows: Label "Spacing Field: {height}" + visual separator icon
 *    - Read-only preview of spacing
 *    - Used to visualize the spacer during form design
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Renders in published forms and previews
 *    - Simple div with specified height (no interactivity)
 *    - Creates visual whitespace between form elements
 *    - No form submission or validation behavior
 *    - Used by end-users to see properly spaced form layout
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Renders in the properties sidebar when field is selected
 *    - React Hook Form for state management
 *    - Zod validation for schema enforcement (height: 5-200px range)
 *    - Features:
 *      - Slider input to adjust height (5px to 200px)
 *      - Changes sync back to designer canvas in real-time
 *      - Form reset on element selection change
 *    - Used by form builders adjusting spacing between elements
 *
 * 5. VALIDATION LOGIC
 *    - validate(): Always returns true (no user input to validate)
 *    - Height validation: 5-200 pixels (enforced in Zod schema)
 *
 * 6. TYPE SAFETY
 *    - CustomInstance: Extends FormElementInstance with typed extraAttributes
 *    - propertiesSchema: Zod schema validates height is number between 5-200
 *
 * DATA FLOW:
 * 1. User drags SpacerField from sidebar -> construct() creates instance
 * 2. Instance renders via DesignerComponent in canvas
 * 3. User clicks field -> PropertiesComponent appears in sidebar with slider
 * 4. User adjusts slider -> updateElement() updates context
 * 5. DesignerComponent re-renders with new height
 * 6. On form publish -> FormComponent replaces DesignerComponent
 * 7. End-user sees form with proper spacing (no interaction)
 *
 * ATTRIBUTE SCHEMA:
 * - height: Number (5-200) - Height of spacer in pixels
 */

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
import { LuSeparatorHorizontal } from "react-icons/lu";
import { Slider } from "../ui/slider";

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
		extraAttributes,
	}),
	designerBtnElement: {
		icon: LuSeparatorHorizontal,
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
			<LuSeparatorHorizontal className="h-8 w-8" />
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
		const { height } = values;
		updateElement(element.id, {
			...element,
			extraAttributes: {
				height,
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

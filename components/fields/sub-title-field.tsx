/**
 * SubtitleField Component - H2 Subtitle/Heading Display Element
 *
 * PURPOSE:
 * Defines a subtitle (H2 heading) display element for the form builder system.
 * Implements all three required contexts: Designer (visual builder), Form (runtime), and Properties (editor).
 * Non-interactive display-only element; does not collect user input or validation.
 *
 * STRUCTURE:
 * This file exports SubTitleFieldFormElement, which is a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "SubTitleField" - Unique identifier for this field type
 *    - extraAttributes: Default configuration (title: "Text Here")
 *    - construct(): Factory function that creates new SubTitleField instances
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Renders in the form builder canvas
 *    - Shows: Label "H2 Heading" + preview of title text (text-lg)
 *    - Read-only preview (user cannot interact in builder)
 *    - Used to visualize the subtitle during form design
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Renders in published forms and previews
 *    - Simple text display styled as H2 heading (text-lg)
 *    - No interactivity, validation, or value collection
 *    - Used to display section headings or subtitles to end-users
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Renders in the properties sidebar when field is selected
 *    - React Hook Form for state management
 *    - Zod validation for schema enforcement (title: 2-50 chars)
 *    - Features:
 *      - Input field to edit subtitle text
 *      - Enter-to-blur behavior for quick editing
 *      - Changes sync back to designer canvas in real-time
 *      - Form reset on element selection change
 *    - Used by form builders adding section headings
 *
 * 5. VALIDATION LOGIC
 *    - validate(): Always returns true (no user input to validate)
 *    - Title validation: 2-50 characters (enforced in Zod schema)
 *
 * 6. TYPE SAFETY
 *    - CustomInstance: Extends FormElementInstance with typed extraAttributes
 *    - propertiesSchema: Zod schema validates title is 2-50 characters
 *
 * DATA FLOW:
 * 1. User drags SubTitleField from sidebar -> construct() creates instance
 * 2. Instance renders via DesignerComponent in canvas
 * 3. User clicks field -> PropertiesComponent appears in sidebar
 * 4. User edits title text -> updateElement() updates context
 * 5. DesignerComponent re-renders with new title
 * 6. On form publish -> FormComponent replaces DesignerComponent
 * 7. End-user sees heading in form (no interaction)
 *
 * ATTRIBUTE SCHEMA:
 * - title: String (2-50 chars) - H2 heading content to display
 */

"use client";

import {
	ElementType,
	FormElement,
	FormElementInstance,
	SubmitFunction,
} from "@/components/form-elements";
import { LuHeading2 } from "react-icons/lu";
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
	title: z.string().min(2).max(50),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const SubTitleFieldFormElement: FormElement = {
	type,

	construct: (id: string) => ({
		id,
		type,
		extraAttributes,
	}),
	designerBtnElement: {
		icon: LuHeading2,
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
		const { title } = values;
		updateElement(element.id, {
			...element,
			extraAttributes: {
				title,
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

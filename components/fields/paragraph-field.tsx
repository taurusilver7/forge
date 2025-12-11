/**
 * ParagraphField Component - Paragraph Text Display Element
 *
 * PURPOSE:
 * Defines a paragraph/body text display element for the form builder system.
 * Implements all three required contexts: Designer (visual builder), Form (runtime), and Properties (editor).
 * Non-interactive display-only element; does not collect user input or validation.
 *
 * STRUCTURE:
 * This file exports ParagraphFieldFormElement, which is a FormElement implementation containing:
 *
 * 1. METADATA & CONFIGURATION
 *    - type: "ParagraphField" - Unique identifier for this field type
 *    - extraAttributes: Default configuration (text: "Text Here")
 *    - construct(): Factory function that creates new ParagraphField instances
 *
 * 2. DESIGNER COMPONENT (DesignerComponent)
 *    - Renders in the form builder canvas
 *    - Shows: Label "Paragraph" + truncated text preview
 *    - Read-only preview (user cannot interact in builder)
 *    - Used to visualize the paragraph during form design
 *
 * 3. FORM COMPONENT (FormComponent)
 *    - Renders in published forms and previews
 *    - Simple text display (styled as paragraph with muted foreground)
 *    - No interactivity, validation, or value collection
 *    - Used to show instructional or descriptive text to end-users
 *
 * 4. PROPERTIES COMPONENT (PropertiesComponent)
 *    - Renders in the properties sidebar when field is selected
 *    - React Hook Form for state management
 *    - Zod validation for schema enforcement (text: 2-50 chars)
 *    - Features:
 *      - Textarea input to edit paragraph text
 *      - Multi-line editing with Enter-to-blur behavior
 *      - Changes sync back to designer canvas in real-time
 *      - Form reset on element selection change
 *    - Used by form builders adding instructional text
 *
 * 5. VALIDATION LOGIC
 *    - validate(): Always returns true (no user input to validate)
 *    - Text validation: 2-50 characters (enforced in Zod schema)
 *
 * 6. TYPE SAFETY
 *    - CustomInstance: Extends FormElementInstance with typed extraAttributes
 *    - propertiesSchema: Zod schema validates text is 2-50 characters
 *
 * DATA FLOW:
 * 1. User drags ParagraphField from sidebar -> construct() creates instance
 * 2. Instance renders via DesignerComponent in canvas
 * 3. User clicks field -> PropertiesComponent appears in sidebar
 * 4. User edits text in textarea -> updateElement() updates context
 * 5. DesignerComponent re-renders with new text
 * 6. On form publish -> FormComponent replaces DesignerComponent
 * 7. End-user sees paragraph text in form (no interaction)
 *
 * ATTRIBUTE SCHEMA:
 * - text: String (2-50 chars) - Paragraph content to display
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
import { BsTextParagraph } from "react-icons/bs";
import { Textarea } from "../ui/textarea";

const type: ElementType = "ParagraphField";

const extraAttributes = {
	text: "Text Here",
};

const propertiesSchema = z.object({
	text: z.string().min(2).max(50),
});

type CustomInstance = FormElementInstance & {
	extraAttributes: typeof extraAttributes;
};

export const ParagraphFieldFormElement: FormElement = {
	type,
	construct: (id: string) => ({
		id,
		type,
		extraAttributes,
	}),
	designerBtnElement: {
		icon: BsTextParagraph,
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
		const { text } = values;
		updateElement(element.id, {
			...element,
			extraAttributes: {
				text,
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

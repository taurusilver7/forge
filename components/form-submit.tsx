"use client";
import React, { useCallback, useRef, useState, useTransition } from "react";
import { FormElementInstance, FormElements } from "./form-elements";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { SubmitForm } from "@/actions/form";
import { CursorArrowIcon } from "@radix-ui/react-icons";
import { ImSpinner } from "react-icons/im";

const FormSubmit = ({
	formUrl,
	content,
}: {
	formUrl: string;
	content: FormElementInstance[];
}) => {
	const [loading, startTransition] = useTransition();
	const [submitted, setSubmitted] = useState(false);

	const [renderKey, setRenderKey] = useState(new Date().getTime());
	const formValues = useRef<{ [key: string]: string }>({});
	const formErrors = useRef<{ [key: string]: boolean }>({});

	const validateForm: () => boolean = useCallback(() => {
		for (const field of content) {
			const actualValue = formValues.current[field.id] || "";
			const valid = FormElements[field.type].validate(field, actualValue);

			if (!valid) {
				formErrors.current[field.id] = true;
			}
		}

		if (Object.keys(formErrors.current).length > 0) {
			return false;
		}

		return true;
	}, [content]);

	const submitValue = useCallback((key: string, value: string) => {
		formValues.current[key] = value;
	}, []);

	const submitForm = async () => {
		formErrors.current = {};
		const validForm = validateForm();
		if (!validForm) {
			setRenderKey(new Date().getTime());
			toast({
				title: "Error",
				description: "please check the form for errors",
				variant: "destructive",
			});
			return;
		}
		try {
			const jsonContent = JSON.stringify(formValues.current);
			await SubmitForm(formUrl, jsonContent);
			setSubmitted(true);
		} catch (error) {
			toast({
				title: "Error",
				description: "Something went wrong",
				variant: "destructive",
			});
		}
	};

	if (submitted) {
		return (
			<div className="flex justify-center w-full h-full items-center p-8">
				<div className="max-w-[620px] flex flex-col gap-4 flex-grow bg-background w-full p-8 overflow-y-auto border shadow-xl shadow-blue-700 rounded">
					<h1 className="text-2xl font-bold">Form submitted</h1>
					<p className="text-muted-foreground">
						Thank you for submitting the form, you can close this page
						now.
					</p>
				</div>
			</div>
		);
	}
	return (
		<div className="flex justify-center w-full h-full items-center p-8">
			<div key={renderKey} className="max-w-2xl flex flex-col gap-4 flex-grow bg-background w-full p-8 overflow-y-auto border shadow-xl shadow-blue-700 rounded">
				{content.map((element) => {
					const FormElement = FormElements[element.type].formComponent;
					return (
						<FormElement
							key={element.id}
							elementInstance={element}
							submitValue={submitValue}
							isInvalid={formErrors.current[element.id]}
							defaultValue={formValues.current[element.id]}
						/>
					);
				})}
				<Button
					variant="outline"
					className="mt-8"
					disabled={loading}
					onClick={() => {
						startTransition(submitForm);
					}}
				>
					{!loading && (
						<>
							<CursorArrowIcon className="mr-2" />
							Submit
						</>
					)}
					{loading && <ImSpinner className="animate-spin" />}
				</Button>
			</div>
		</div>
	);
};

export default FormSubmit;

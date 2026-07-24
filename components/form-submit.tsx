"use client";
import { useCallback, useRef, useState, useTransition } from "react";
import { FormElementInstance, FormElements } from "./form-elements";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { SubmitForm } from "@/actions/form";
import { checkCondition } from "@/lib/condition";
import { getUniquePages, getPageElements } from "@/lib/pages";
import { CursorArrowIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";

const FormSubmit = ({
	formUrl,
	formName,
	content,
}: {
	formUrl: string;
	formName: string;
	content: FormElementInstance[];
}) => {
	const [loading, startTransition] = useTransition();
	const [submitted, setSubmitted] = useState(false);

	const [renderKey, setRenderKey] = useState(new Date().getTime());
	const [pageIndex, setPageIndex] = useState(0);
	const formValues = useRef<{ [key: string]: string }>({});
	const formErrors = useRef<{ [key: string]: boolean }>({});

	const pages = getUniquePages(content);
	const currentPageElements = getPageElements(content, pages[pageIndex]);

	const validatePage = useCallback((fields: FormElementInstance[]): boolean => {
		let hasError = false;
		for (const field of fields) {
			const actualValue = formValues.current[field.id] || "";
			const valid = FormElements[field.type].validate(field, actualValue);
			if (!valid) {
				formErrors.current[field.id] = true;
				hasError = true;
			}
		}
		return !hasError;
	}, []);

	const validateForm: () => boolean = useCallback(() => {
		return validatePage(content);
	}, [content, validatePage]);

	const submitValue = useCallback((key: string, value: string) => {
		formValues.current[key] = value;
	}, []);

	const handleNext = () => {
		formErrors.current = {};
		if (!validatePage(currentPageElements)) {
			setRenderKey(new Date().getTime());
			return;
		}
		formValues.current["_lastPageReached"] = String(pageIndex + 2);
		setPageIndex((i) => i + 1);
		setRenderKey(new Date().getTime());
	};

	const handleBack = () => {
		setPageIndex((i) => i - 1);
	};

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
		formValues.current["_lastPageReached"] = String(pages.length);
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
			<div className="flex justify-center w-full py-12 px-4">
				<div className="w-full max-w-2xl bg-background p-8 rounded-xl shadow-sm border border-border/50">
					<h1 className="text-2xl font-bold">Form submitted</h1>
					<p className="text-muted-foreground mt-2">
						Thank you for submitting the form, you can close this page
						now.
					</p>
				</div>
			</div>
		);
	}
	return (
		<div className="w-full py-12 px-4">
			<div
				key={renderKey}
				className="max-w-2xl mx-auto flex flex-col gap-4 bg-background p-8 rounded-xl shadow-sm "
			>
				<h1 className="text-2xl font-semibold mb-2">{formName}</h1>
				{pages.length > 1 && (
					<div className="w-full bg-secondary h-2 rounded-full">
						<div
							className="bg-primary h-2 rounded-full transition-all"
							style={{ width: `${((pageIndex + 1) / pages.length) * 100}%` }}
						/>
					</div>
				)}
				{currentPageElements.map((element) => {
					const cond = (element.extraAttributes as any)?.condition;
					if (cond) {
						const depValue = formValues.current[cond.fieldId] || "";
						const depField = content.find((f) => f.id === cond.fieldId);
						if (depField) {
							const matches = checkCondition(cond, depValue);
							if (cond.action === "hide" && matches) return null;
							if (cond.action === "show" && !matches) return null;
						}
					}
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
				<div className="flex justify-between mt-8">
					{pageIndex > 0 && (
						<Button variant="outline" onClick={handleBack}>
							Back
						</Button>
					)}
					<div className="flex-1" />
					{pages.length > 1 && pageIndex < pages.length - 1 ? (
						<Button onClick={handleNext}>
							Next
						</Button>
					) : (
						<Button
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
							{loading && <Loader2 className="animate-spin" />}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};

export default FormSubmit;

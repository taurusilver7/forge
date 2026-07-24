"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FormElementInstance, FormElements } from "./form-elements";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "./ui/use-toast";
import { SubmitForm, VerifyFormPassword } from "@/actions/form";
import { checkCondition } from "@/lib/condition";
import { getUniquePages, getPageElements } from "@/lib/pages";
import { CursorArrowIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";

const COOKIE_PREFIX = "forge_submitted_";

function getDuplicateCookie(formUrl: string): boolean {
	if (typeof document === "undefined") return false;
	return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE_PREFIX}${formUrl}=1`));
}

function setDuplicateCookie(formUrl: string) {
	document.cookie = `${COOKIE_PREFIX}${formUrl}=1; path=/; max-age=86400; SameSite=Lax`;
}

const FormSubmit = ({
	formUrl,
	formName,
	content,
	passwordHash,
	thankYouMessage,
	redirectUrl,
	closeDate,
	submissionLimit,
	submissions,
	hasDuplicateProtection,
}: {
	formUrl: string;
	formName: string;
	content: FormElementInstance[];
	passwordHash: string | null;
	thankYouMessage: string | null;
	redirectUrl: string | null;
	closeDate: string | null;
	submissionLimit: number | null;
	submissions: number;
	hasDuplicateProtection: boolean;
}) => {
	const [loading, startTransition] = useTransition();
	const [submitted, setSubmitted] = useState(false);
	const [renderKey, setRenderKey] = useState(new Date().getTime());
	const [pageIndex, setPageIndex] = useState(0);
	const [passwordUnlocked, setPasswordUnlocked] = useState(!passwordHash);
	const [passwordValue, setPasswordValue] = useState("");
	const [passwordError, setPasswordError] = useState(false);
	const formValues = useRef<{ [key: string]: string }>({});
	const formErrors = useRef<{ [key: string]: boolean }>({});

	const alreadySubmitted = hasDuplicateProtection && getDuplicateCookie(formUrl);
	const isClosed =
		(closeDate && new Date() > new Date(closeDate)) ||
		(submissionLimit !== null && submissions >= submissionLimit);

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

	const handlePasswordSubmit = async () => {
		setPasswordError(false);
		const valid = await VerifyFormPassword(formUrl, passwordValue);
		if (valid) {
			setPasswordUnlocked(true);
		} else {
			setPasswordError(true);
		}
	};

	const submitForm = async () => {
		formErrors.current = {};
		const validForm = validateForm();
		if (!validForm) {
			setRenderKey(new Date().getTime());
			toast({ title: "Error", description: "please check the form for errors", variant: "destructive" });
			return;
		}
		formValues.current["_lastPageReached"] = String(pages.length);
		try {
			const jsonContent = JSON.stringify(formValues.current);
			await SubmitForm(formUrl, jsonContent);
			if (hasDuplicateProtection) setDuplicateCookie(formUrl);
			setSubmitted(true);
		} catch (error: any) {
			const msg = error?.message;
			if (msg === "FORM_CLOSED") {
				toast({ title: "Form closed", description: "This form is no longer accepting submissions.", variant: "destructive" });
			} else {
				toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
			}
		}
	};

	useEffect(() => {
		if (submitted && redirectUrl) {
			window.location.href = redirectUrl;
		}
	}, [submitted, redirectUrl]);

	if (submitted && !redirectUrl) {
		return (
			<div className="flex justify-center w-full py-12 px-4">
				<div className="w-full max-w-2xl bg-background p-8 rounded-xl shadow-sm border border-border/50">
					<h1 className="text-2xl font-bold">Form submitted</h1>
					<p className="text-muted-foreground mt-2">
						{thankYouMessage || "Thank you for submitting the form, you can close this page now."}
					</p>
				</div>
			</div>
		);
	}

	if (!passwordUnlocked) {
		return (
			<div className="flex justify-center w-full py-12 px-4">
				<div className="w-full max-w-md bg-background p-8 rounded-xl shadow-sm border border-border/50">
					<div className="flex items-center gap-2 mb-6">
						<LockClosedIcon className="h-5 w-5" />
						<h1 className="text-xl font-bold">Password Required</h1>
					</div>
					<p className="text-muted-foreground mb-4">This form is password protected. Please enter the password to continue.</p>
					<Input
						type="password"
						placeholder="Enter password"
						value={passwordValue}
						onChange={(e) => { setPasswordValue(e.target.value); setPasswordError(false); }}
						onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
						className={passwordError ? "border-red-500" : ""}
					/>
					{passwordError && <p className="text-red-500 text-sm mt-1">Incorrect password</p>}
					<Button onClick={handlePasswordSubmit} className="mt-4 w-full">
						Submit
					</Button>
				</div>
			</div>
		);
	}

	if (alreadySubmitted) {
		return (
			<div className="flex justify-center w-full py-12 px-4">
				<div className="w-full max-w-2xl bg-background p-8 rounded-xl shadow-sm border border-border/50">
					<h1 className="text-2xl font-bold">Already submitted</h1>
					<p className="text-muted-foreground mt-2">You have already submitted this form.</p>
				</div>
			</div>
		);
	}

	if (isClosed) {
		return (
			<div className="flex justify-center w-full py-12 px-4">
				<div className="w-full max-w-2xl bg-background p-8 rounded-xl shadow-sm border border-border/50">
					<h1 className="text-2xl font-bold">Form closed</h1>
					<p className="text-muted-foreground mt-2">This form is no longer accepting submissions.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full py-4 px-4">
			<div
				key={renderKey}
				className="max-w-2xl mx-auto flex flex-col gap-4 bg-background p-8 rounded-xl shadow-sm"
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
						<Button variant="outline" onClick={handleBack}>Back</Button>
					)}
					<div className="flex-1" />
					{pages.length > 1 && pageIndex < pages.length - 1 ? (
						<Button onClick={handleNext}>Next</Button>
					) : (
						<Button
							disabled={loading}
							onClick={() => startTransition(submitForm)}
						>
							{!loading && <><CursorArrowIcon className="mr-2" />Submit</>}
							{loading && <Loader2 className="animate-spin" />}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};

export default FormSubmit;
// ponytail: cookie-only duplicate protection, upgrade to server-side dedup if abuse detected

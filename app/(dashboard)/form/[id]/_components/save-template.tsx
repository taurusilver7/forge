"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { SaveTemplate as SaveTemplateAction } from "@/actions/template";
import { useTransition } from "react";

export function SaveTemplate({ formName, formContent }: { formName: string; formContent: string }) {
	const [pending, startTransition] = useTransition();

	const save = () => {
		startTransition(async () => {
			try {
				await SaveTemplateAction(formName, "", formContent);
				toast({ title: "Template saved", description: `"${formName}" saved to your templates.` });
			} catch {
				toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
			}
		});
	};

	return (
		<Button variant="outline" size="sm" onClick={save} disabled={pending}>
			<FileDown className="h-4 w-4 mr-1" /> {pending ? "Saving..." : "Save as Template"}
		</Button>
	);
}
// ponytail: DB-backed; no category picker UI — defaults to "Custom", add if template library grows

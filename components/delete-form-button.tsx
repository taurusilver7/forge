"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DeleteForm } from "@/actions/form";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteFormButton({ formId, formName }: { formId: string; formName: string }) {
	const [open, setOpen] = useState(false);
	const [confirm, setConfirm] = useState("");
	const [deleting, setDeleting] = useState(false);

	const handleDelete = async () => {
		setDeleting(true);
		try {
			await DeleteForm(formId);
			window.location.href = "/";
		} catch {
			toast({ title: "Error", description: "Failed to delete form", variant: "destructive" });
			setDeleting(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button className="w-52" variant="destructive">
					<Trash2 className="h-4 w-4 mr-2" />
					Delete Form
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete this form?</AlertDialogTitle>
					<AlertDialogDescription>
						This permanently deletes <strong>{formName}</strong> and all its submissions. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="space-y-2">
					<Label>Type the form name to confirm</Label>
					<Input
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						placeholder={formName}
					/>
				</div>
				<AlertDialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={confirm !== formName || deleting}
						onClick={handleDelete}
					>
						{deleting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
						Delete
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

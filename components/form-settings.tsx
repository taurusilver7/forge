"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UpdateFormSettings } from "@/actions/form";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type FormSettingsData = {
	id: string;
	passwordHash: string | null;
	thankYouMessage: string | null;
	redirectUrl: string | null;
	closeDate: string | null;
	submissionLimit: number | null;
	hasDuplicateProtection: boolean;
};

export default function FormSettings({ form }: { form: FormSettingsData }) {
	const [saving, setSaving] = useState(false);
	const [password, setPassword] = useState("");
	const [thankYouMessage, setThankYouMessage] = useState(form.thankYouMessage || "");
	const [redirectUrl, setRedirectUrl] = useState(form.redirectUrl || "");
	const [closeDate, setCloseDate] = useState(form.closeDate || "");
	const [submissionLimit, setSubmissionLimit] = useState(form.submissionLimit?.toString() || "");
	const [hasDuplicateProtection, setHasDuplicateProtection] = useState(form.hasDuplicateProtection);
	const [hasPassword, setHasPassword] = useState(!!form.passwordHash);

	const save = async () => {
		setSaving(true);
		try {
			await UpdateFormSettings(form.id, {
				password: password || (hasPassword ? undefined : undefined),
				thankYouMessage,
				redirectUrl,
				closeDate: closeDate || null,
				submissionLimit: submissionLimit ? parseInt(submissionLimit) : null,
				hasDuplicateProtection,
			});
			setPassword("");
			toast({ title: "Saved" });
		} catch {
			toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};

	const removePassword = async () => {
		setSaving(true);
		await UpdateFormSettings(form.id, { password: "" });
		setHasPassword(false);
		setPassword("");
		setSaving(false);
		toast({ title: "Password removed" });
	};

	return (
		<div className="container pt-10 space-y-6 max-w-2xl">
			<h2 className="text-2xl font-bold">Form Settings</h2>

			<div className="space-y-2">
				<Label>Password Protect</Label>
				<div className="flex gap-2 items-center">
					<Input
						type="password"
						placeholder={hasPassword ? "Change password" : "Set password"}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					{hasPassword && (
						<Button variant="outline" onClick={removePassword} disabled={saving}>
							Remove
						</Button>
					)}
				</div>
			</div>

			<div className="space-y-2">
				<Label>Thank You Message</Label>
				<textarea
					className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
					placeholder="Thank you for submitting the form, you can close this page now."
					value={thankYouMessage}
					onChange={(e) => setThankYouMessage(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label>Redirect URL</Label>
				<Input
					placeholder="https://example.com/thank-you"
					value={redirectUrl}
					onChange={(e) => setRedirectUrl(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label>Close on Date</Label>
				<Input
					type="datetime-local"
					value={closeDate}
					onChange={(e) => setCloseDate(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label>Submission Limit</Label>
				<Input
					type="number"
					min="1"
					placeholder="No limit"
					value={submissionLimit}
					onChange={(e) => setSubmissionLimit(e.target.value)}
				/>
			</div>

			<div className="flex items-center gap-2">
				<Switch
					checked={hasDuplicateProtection}
					onCheckedChange={setHasDuplicateProtection}
				/>
				<Label>Prevent duplicate submissions</Label>
			</div>

			<Button onClick={save} disabled={saving}>
				{saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
				Save Settings
			</Button>
		</div>
	);
}

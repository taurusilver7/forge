"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { UpdateFormBranding } from "@/actions/form";
import { Share1Icon } from "@radix-ui/react-icons";
import { Copy } from "lucide-react";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ACCENTS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#7c3aed"];

const FormLinkShare = ({
	shareUrl,
	formId,
	accent,
	logo,
	name,
}: {
	shareUrl: string;
	formId: string;
	accent: string;
	logo: string | null;
	name: string;
}) => {
	const [mounted, setMounted] = useState(false);
	const [currentAccent, setCurrentAccent] = useState(accent);
	const [currentLogo, setCurrentLogo] = useState(logo || "");

	useEffect(() => {
		setMounted(true);
	}, []);
	if (!mounted) {
		return null;
	}
	const shareLink = `${window.location.origin}/submit/${shareUrl}`;
	const iframeCode = `<iframe src="${shareLink}" width="100%" height="600" frameborder="0"></iframe>`;
	const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`;

	const saveBranding = async (newAccent: string, newLogo: string) => {
		try {
			await UpdateFormBranding(formId, newAccent, newLogo);
			toast({ title: "Branding saved" });
		} catch {
			toast({
				title: "Error",
				description: "Failed to save branding",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="border rounded-lg p-4 bg-card space-y-4">
			<h2 className="text-lg font-semibold mb-4">Share Form</h2>
			<div className="flex gap-4 items-center">
				<Input value={shareLink} readOnly />
				<Button
					className="w-64 shrink-0"
					onClick={() => {
						navigator.clipboard.writeText(shareLink);
						toast({
							title: "Copied to clipboard",
							description: "Link copied to clipboard",
						});
					}}
				>
					<Share1Icon className="mr-2 h-4 w-4" />
					Share
				</Button>
			</div>
			<div className="flex gap-6 items-start mt-4">
				<div className="flex-1 space-y-1">
					<Label className="text-xs text-muted-foreground font-medium">
						Embed iframe
					</Label>
					<div className="flex gap-2">
						<Textarea value={iframeCode} readOnly rows={6} className="text-xs font-mono resize-none" />
						<Button
							variant="outline"
							size="sm"
							className="shrink-0"
							onClick={() => {
								navigator.clipboard.writeText(iframeCode);
								toast({ title: "Iframe code copied" });
							}}
						>
							<Copy className="mr-1 h-3 w-3" /> Copy
						</Button>
					</div>
				</div>
				<div className="border rounded p-1 shrink-0">
					<img src={qrUrl} alt="QR Code" className="w-30 h-30" />
				</div>
			</div>

			<div className="border-t pt-4 space-y-3">
				<h3 className="text-sm font-semibold">Branding</h3>
				<div className="space-y-1">
					<Label className="text-xs text-muted-foreground font-medium">
						Accent color
					</Label>
					<div className="flex items-center gap-2">
						{ACCENTS.map((c) => (
							<button
								key={c}
								type="button"
								aria-label={`Accent ${c}`}
								onClick={() => {
									setCurrentAccent(c);
									saveBranding(c, currentLogo);
								}}
								className={cn(
									"h-6 w-6 rounded-full border-2 border-transparent",
									currentAccent === c && "border-foreground",
								)}
								style={{ backgroundColor: c }}
							/>
						))}
						<Input
							type="color"
							value={currentAccent}
							onChange={(e) => {
								setCurrentAccent(e.target.value);
								saveBranding(e.target.value, currentLogo);
							}}
							className="h-8 w-10 p-0 border"
						/>
					</div>
				</div>
				<div className="space-y-1">
					<Label className="text-xs text-muted-foreground font-medium">
						Logo URL
					</Label>
					<Input
						value={currentLogo}
						placeholder="https://…/logo.png"
						onBlur={() => saveBranding(currentAccent, currentLogo)}
						onChange={(e) => setCurrentLogo(e.target.value)}
					/>
					<p className="text-xs text-muted-foreground">
						Shown on the public form header. Falls back to the form name.
					</p>
				</div>
				<div
					className="flex items-center gap-2 rounded-md px-3 py-2 text-white"
					style={{ backgroundColor: currentAccent }}
				>
					{currentLogo ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={currentLogo}
							alt=""
							className="h-6 w-6 rounded bg-white object-cover"
						/>
					) : (
						<span className="text-sm font-semibold">{name}</span>
					)}
					<span className="text-xs opacity-80">Preview</span>
				</div>
			</div>
		</div>
	);
};
// ponytail: raw iframe; React embed SDK if tracking needed
// ponytail: public QR API; self-hosted if external dep becomes a problem

export default FormLinkShare;

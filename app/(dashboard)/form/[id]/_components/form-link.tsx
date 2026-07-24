"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Share1Icon } from "@radix-ui/react-icons";
import { Copy } from "lucide-react";
import React, { useEffect, useState } from "react";

const FormLinkShare = ({ shareUrl }: { shareUrl: string }) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);
	if (!mounted) {
		return null;
	}
	const shareLink = `${window.location.origin}/submit/${shareUrl}`;
	const iframeCode = `<iframe src="${shareLink}" width="100%" height="600" frameborder="0"></iframe>`;
	const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`;


	return (
		<div className="border rounded-lg p-4 bg-card">
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
		</div>
	);
};
// ponytail: raw iframe; React embed SDK if tracking needed
// ponytail: public QR API; self-hosted if external dep becomes a problem

export default FormLinkShare;

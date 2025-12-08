"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Share1Icon } from "@radix-ui/react-icons";
import React, { useEffect, useState } from "react";

const FormLinkShare = ({ shareUrl }: { shareUrl: string }) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);
	if (!mounted) {
		return null;
		// prevent ssr warning (window is undefined)
	}
	const shareLink = `${window.location.origin}/submit/${shareUrl}`;
	return (
		<div className="flex flex-grow gap-4 items-center">
			<Input value={shareLink} readOnly />
			<Button
				className="w-64"
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
	);
};

export default FormLinkShare;

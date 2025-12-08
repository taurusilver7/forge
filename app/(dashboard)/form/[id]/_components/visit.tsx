"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";

const VisitBtn = ({ shareUrl }: { shareUrl: string }) => {
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
		<Button
			className="w-52"
			onClick={() => {
				window.open(shareLink, "_blank");
			}}
		>
			Visit
		</Button>
	);
};

export default VisitBtn;

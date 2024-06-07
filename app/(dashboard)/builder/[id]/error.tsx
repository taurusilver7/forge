"use client";

import React, { useEffect } from "react";

function ErrorPage({ error }: { error: Error }) {
	useEffect(() => {
		console.log(error);
	}, [error]);
	return (
		<div className="flex w-full h-full flex-col items-center justify-center gap-4">
			<h2 className="text-destructive text-4xl">Something went wrong</h2>
		</div>
	);
}

export default ErrorPage;

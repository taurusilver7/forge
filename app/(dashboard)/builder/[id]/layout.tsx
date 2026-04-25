import { Metadata } from "next";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Builder | Forge",
	description: "A full-stack form building SaaS",
	icons: {
		icon: [
			{
				href: "/logo.svg",
				url: "/logo.svg",
			},
		],
	},
};

export default function BuilderLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="flex w-full h-screen overflow-hidden mx-auto">{children}</div>;
}

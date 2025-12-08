import { Metadata } from "next";
import React from "react";


export const metadata: Metadata = {
	title: "Forge | A Form Building Master",
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

const FormDetailLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex w-full flex-col flex-grow mx-auto">{children}</div>
	);
};

export default FormDetailLayout;

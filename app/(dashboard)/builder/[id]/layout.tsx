import { Metadata } from "next";
import DesignerContextProvider from "@/components/context/designer-context";

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
	return (
		<DesignerContextProvider>
			<div className="flex w-full max-h-full overflow-hidden mx-auto">
				{children}
			</div>
		</DesignerContextProvider>
	);
}

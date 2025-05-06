import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme";
import DesignerContextProvider from "@/components/context/designer-context";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

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

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body className={inter.className}>
					<DesignerContextProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="dark"
							enableSystem
							disableTransitionOnChange
						>
							{children}
							<Analytics />
							<Toaster />
						</ThemeProvider>
					</DesignerContextProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}

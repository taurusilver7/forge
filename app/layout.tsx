import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme";
import { Toaster } from "@/components/ui/toaster";
import DesignerContextProvider from "@/components/context/designer-context";

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
			<html lang="en" suppressHydrationWarning>
				<body className={inter.className}>
					<DesignerContextProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="dark"
							enableSystem
							disableTransitionOnChange
						>
							{children}
							<Toaster />
						</ThemeProvider>
					</DesignerContextProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}

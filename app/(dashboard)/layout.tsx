import Logo from "@/components/logo";
import ThemeSwitcher from "@/components/theme-switcher";
import { UserButton } from "@clerk/nextjs";
import React, { ReactNode } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
	return (
		<div className="flex flex-col min-h-screen min-w-full bg-background max-h-screen">
			<nav className="flex justify-between border-b border-border h-16 px-4 py-2 items-center">
				<Logo />
				<div className="flex items-center gap-4">
					<ThemeSwitcher />
					<UserButton afterSignOutUrl="/sign-in" />
				</div>
			</nav>

			<main className="flex w-full flex-grow">{children}</main>
		</div>
	);
};

export default DashboardLayout;


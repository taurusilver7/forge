import React from "react";
import ThemeSwitcher from "@/components/theme-switcher";

const SubmitLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="min-h-screen min-w-full bg-muted/30">
			<div className="fixed top-4 right-4 z-50">
				<ThemeSwitcher />
			</div>
			<main className="flex justify-center w-full">{children}</main>
		</div>
	);
};

export default SubmitLayout;

import React, { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => {
	return (
		<div className="flex h-screen mx-auto max-w-2xl items-center justify-center">
			{children}
		</div>
	);
};

export default AuthLayout;

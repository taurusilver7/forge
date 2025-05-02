import Image from "next/image";
import Link from "next/link";
import React from "react";

const Logo = () => {
	return (
		<Link
			href={"/"}
			className="no-underline flex gap-2  hover:cursor-pointer"
		>
			<Image src="/logo.svg" alt="logo" width={40} height={40} />
			<span className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-700 to-violet-500 text-transparent bg-clip-text">
				Forge
			</span>
		</Link>
	);
};

export default Logo;

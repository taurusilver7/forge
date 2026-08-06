import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function StatsCard({
	title,
	value,
	icon,
	children,
	className,
}: {
	title: string;
	value: ReactNode;
	icon?: ReactNode;
	children?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"bg-background w-full shadow-sm border p-4 rounded-md",
				className,
			)}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-sm text-muted-foreground">{title}</span>
				{icon}
			</div>
			<p className="text-2xl font-bold">{value}</p>
			{children}
		</div>
	);
}

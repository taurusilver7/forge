import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardProps {
	title: string;
	value: ReactNode;
	helperText?: string;
	loading: boolean;
	icon: ReactNode;
	className?: string;
}

const StatsCard = ({
	title,
	value = "0",
	icon,
	helperText,
	loading,
	className,
}: StatsCardProps) => (
	<Card className={cn("transition-shadow hover:shadow-md", className)}>
		<CardHeader className="flex flex-row items-center justify-between pb-2">
			<CardTitle className="text-sm font-medium">{title}</CardTitle>
			{icon}
		</CardHeader>
		<CardContent>
			<div className="text-2xl font-bold">
				{loading ? <Skeleton className="h-8 w-20" /> : value}
			</div>
			{helperText && (
				<p className="text-xs text-muted-foreground pt-1">{helperText}</p>
			)}
		</CardContent>
	</Card>
);

export default StatsCard;

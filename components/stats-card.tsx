"use client";

import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";

interface StatsCardProps {
	title: string;
	value: string;
	helperText: string;
	loading: boolean;
	icon: ReactNode;
	className: string;
}

const StatsCard = ({
	title,
	value = "0",
	icon,
	helperText,
	loading,
	className,
}: StatsCardProps) => {
	return (
		<Card className={className}>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				{icon}
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">
					{loading && (
						<Skeleton>
							<span className="opacity-50">{value}</span>
						</Skeleton>
					)}
					{!loading && value}
				</div>
				<p className="text-xs text-muted-foreground pt-1">{helperText}</p>
			</CardContent>
		</Card>
	);
};

export default StatsCard;

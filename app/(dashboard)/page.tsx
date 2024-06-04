import { GetFormStats } from "@/actions/form";
import CreateFormButton from "@/components/create-form-btn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EyeOpenIcon,
	CursorArrowIcon,
	ViewVerticalIcon,
	MixerVerticalIcon,
} from "@radix-ui/react-icons";
import React, { ReactNode, Suspense } from "react";

interface StatCardsProps {
	data?: Awaited<ReturnType<typeof GetFormStats>>;
	loading: boolean;
}

const DashboardPage = () => {
	return (
		<div className="container pt-4">
			<Suspense fallback={<StatCards loading={true} />}>
				<CardStatsWrapper />
			</Suspense>
			<Separator className="my-6" />
			<h2 className="text-3xl font-bold col-span-2">Your forms</h2>
			<Separator className="my-6" />
			<CreateFormButton />
		</div>
	);
};

export default DashboardPage;

async function CardStatsWrapper() {
	const stats = await GetFormStats();

	return <StatCards loading={false} data={stats} />;
}

function StatCards(props: StatCardsProps) {
	const { data, loading } = props;

	return (
		<div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
			<StatsCard
				title="Total Visits"
				icon={<EyeOpenIcon className="text-blue-600 h-6 w-6" />}
				helperText="All time vists"
				value={data?.visits.toLocaleString() || ""}
				loading={loading}
				className="shadow-md shadow-blue-600"
			/>
			<StatsCard
				title="Total Submissions"
				icon={<ViewVerticalIcon className="text-yellow-600 w-6 h-6" />}
				helperText="All time submissions."
				value={data?.submissions.toLocaleString() || ""}
				loading={loading}
				className="shadow-md shadow-yellow-600"
			/>
			<StatsCard
				title="Submissions rate"
				icon={<CursorArrowIcon className="text-green-600 w-6 h-6" />}
				helperText="visits that submitted form."
				value={data?.submissionRate.toLocaleString() + "%" || ""}
				loading={loading}
				className="shadow-md shadow-green-600"
			/>
			<StatsCard
				title="Bounce rate"
				icon={<MixerVerticalIcon className="text-rose-600 h-6 w-6" />}
				helperText="Visits that leave without interacting."
				value={data?.bounceRate.toLocaleString() + "%" || ""}
				loading={loading}
				className="shadow-md shadow-rose-600"
			/>
		</div>
	);
}

const StatsCard = ({
	title,
	value,
	icon,
	helperText,
	loading,
	className,
}: {
	title: string;
	value: string;
	helperText: string;
	loading: boolean;
	icon: ReactNode;
	className: string;
}) => {
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
							<span className="opacity-0">{value}</span>
						</Skeleton>
					)}
				</div>
				<p className="text-xs text-muted-foreground pt-1">{helperText}</p>
			</CardContent>
		</Card>
	);
};

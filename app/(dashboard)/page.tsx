import { GetFormStats } from "@/actions/form";
import CreateFormButton from "@/components/create-form-btn";
import FormCards, { FormCardSkeleton } from "@/components/form-cards";
import StatsCard from "@/components/stats-card";
import { Separator } from "@/components/ui/separator";
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
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<CreateFormButton />

				<Suspense
					fallback={[1, 2, 3, 4].map((el) => (
						<FormCardSkeleton key={el} />
					))}
				>
					{/* form cards */}
					<FormCards />
				</Suspense>
			</div>
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

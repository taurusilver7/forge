import {
	GetFormStats,
	GetForms,
	GetGlobalInsights,
	GetInboxData,
} from "@/actions/form";
import { FormsBrowser, FormsBrowserSkeleton } from "@/components/forms-browser";
import { InboxView } from "@/components/inbox";
import StatsCard from "@/components/stats-card";
import { Separator } from "@/components/ui/separator";
import {
	EyeOpenIcon,
	CursorArrowIcon,
	DashboardIcon,
	MixerVerticalIcon,
} from "@radix-ui/react-icons";
import { Suspense } from "react";

interface StatCardsProps {
	data?: Awaited<ReturnType<typeof GetFormStats>>;
	loading: boolean;
}

const DashboardPage = () => {
	return (
		<div className="container pt-4 mb-10">
			<Suspense fallback={<StatCards loading={true} />}>
				<CardStatsWrapper />
			</Suspense>
			<Separator className="my-6" />
			<h2 className="text-3xl font-bold col-span-2">Your forms</h2>
			<Separator className="my-6" />
			<Suspense fallback={<FormsBrowserSkeleton />}>
				<FormsBrowserWrapper />
			</Suspense>
			<Separator className="my-6" />
			<Suspense fallback={null}>
				<GlobalInsights />
			</Suspense>
			<Separator className="my-6" />
			<Suspense fallback={null}>
				<InboxWrapper />
			</Suspense>
		</div>
	);
};

export default DashboardPage;

async function FormsBrowserWrapper() {
	const forms = (await GetForms()) ?? [];
	return <FormsBrowser forms={forms} />;
}

async function InboxWrapper() {
	const data = await GetInboxData();

	return (
		<section className="w-full mt-8">
			<h2 className="text-2xl font-semibold">Inbox</h2>
			<p className="text-muted-foreground text-sm mb-4">
				Latest submissions across all forms.
			</p>
			<InboxView data={data} />
		</section>
	);
}

async function CardStatsWrapper() {
	const stats = await GetFormStats();

	return <StatCards loading={false} data={stats} />;
}

function StatCards(props: StatCardsProps) {
	const { data } = props;

	return (
		<div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
			<StatsCard
				title="Total Visits"
				icon={<EyeOpenIcon className="text-blue-600 h-6 w-6" />}
				value={data?.visits.toLocaleString() || ""}
			/>
			<StatsCard
				title="Total Submissions"
				icon={<DashboardIcon className="text-yellow-600 w-6 h-6" />}
				value={data?.submissions.toLocaleString() || ""}
			/>
			<StatsCard
				title="Submissions rate"
				icon={<CursorArrowIcon className="text-green-600 w-6 h-6" />}
				value={data?.submissionRate.toLocaleString() + "%" || ""}
			/>
			<StatsCard
				title="Bounce rate"
				icon={<MixerVerticalIcon className="text-rose-600 h-6 w-6" />}
				value={data?.bounceRate.toLocaleString() + "%" || ""}
			/>
		</div>
	);
}

async function GlobalInsights() {
	const insights = await GetGlobalInsights();

	return (
		<StatsCard
			title="Top performing forms"
			value={`${insights.totalSubmissions} total submissions`}
		>
			{insights.topForms.length === 0 ? (
				<p className="text-xs text-muted-foreground mt-2">
					Publish a form to see performance.
				</p>
			) : (
				<div className="space-y-2 mt-2">
					{insights.topForms.map((f) => (
						<div key={f.name} className="flex justify-between text-sm">
							<span className="truncate">{f.name}</span>
							<span className="tabular-nums text-muted-foreground">
								{f.submissions} subs · {f.visits} visits
							</span>
						</div>
					))}
				</div>
			)}
		</StatsCard>
	);
}

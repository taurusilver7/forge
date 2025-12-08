import { GetFormById } from "@/actions/form";
import StatsCard from "@/components/stats-card";
import {
	CursorArrowIcon,
	DashboardIcon,
	EyeOpenIcon,
	MixerVerticalIcon,
} from "@radix-ui/react-icons";
import React from "react";
import VisitBtn from "./_components/visit";
import FormLinkShare from "./_components/form-link";
import SubmissionsTable from "./_components/submission-table";

const FormDetails = async ({ params }: { params: { id: string } }) => {
	const { id } = params;
	const form = await GetFormById(id);

	if (!form) {
		throw new Error("form not found");
	}

	const { visits, submissions } = form;
	let submissionRate = 0;
	if (visits > 0) {
		submissionRate = (submissions / visits) * 100;
	}
	const bounceRate = 100 - submissionRate;
	return (
		<>
			<div className="py-10 border-b border-muted">
				<div className="flex justify-between container">
					<h1 className="text-4xl font-bold truncate">{form.name}</h1>
					<VisitBtn shareUrl={form.shareURL} />
				</div>
			</div>
			<div className="py-4 border-b border-muted">
				<div className="container flex gap-2 items-center justify-between">
					<FormLinkShare shareUrl={form.shareURL} />
				</div>
			</div>
			<div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 container">
				<StatsCard
					title="Total Visits"
					icon={<EyeOpenIcon className="text-blue-600 h-6 w-6" />}
					helperText="All time vists"
					value={visits.toLocaleString() || ""}
					loading={false}
					className="shadow-md shadow-blue-600"
				/>
				<StatsCard
					title="Total Submissions"
					icon={<DashboardIcon className="text-yellow-600 w-6 h-6" />}
					helperText="All time submissions."
					value={submissions.toLocaleString() || ""}
					loading={false}
					className="shadow-md shadow-yellow-600"
				/>
				<StatsCard
					title="Submissions rate"
					icon={<CursorArrowIcon className="text-green-600 w-6 h-6" />}
					helperText="visits that submitted form."
					value={submissionRate.toLocaleString() + "%" || ""}
					loading={false}
					className="shadow-md shadow-green-600"
				/>
				<StatsCard
					title="Bounce rate"
					icon={<MixerVerticalIcon className="text-rose-600 h-6 w-6" />}
					helperText="Visits that leave without interacting."
					value={bounceRate.toLocaleString() + "%" || ""}
					loading={false}
					className="shadow-md shadow-rose-600"
				/>
			</div>

			<div className="container pt-10">
				<SubmissionsTable id={form.id} />
			</div>
		</>
	);
};

export default FormDetails;

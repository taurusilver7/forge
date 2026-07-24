import { GetFormById } from "@/actions/form";
import StatsCard from "@/components/stats-card";
import {
	CursorArrowIcon,
	DashboardIcon,
	EyeOpenIcon,
	MixerVerticalIcon,
} from "@radix-ui/react-icons";
import VisitBtn from "./_components/visit";
import FormLinkShare from "./_components/form-link";
import SubmissionsTable from "./_components/submission-table";
import { SaveTemplate } from "./_components/save-template";
import FormSettings from "@/components/form-settings";
import { DeleteFormButton } from "@/components/delete-form-button";

const FormDetails = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	const form = await GetFormById(id);

	if (!form) throw new Error("form not found");

	const { visits, submissions } = form;
	const submissionRate = visits > 0 ? (submissions / visits) * 100 : 0;
	const bounceRate = 100 - submissionRate;

	return (
		<>
			<div className="py-10 border-b border-muted">
				<div className="flex justify-between container">
					<h1 className="text-4xl font-bold truncate">{form.name}</h1>
					<div className="flex items-center gap-2">
						<VisitBtn shareUrl={form.shareURL} />
						<DeleteFormButton formId={form.id} formName={form.name} />
					</div>
				</div>
			</div>
			<div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 container">
			<StatsCard
				title="Total Visits"
				icon={<EyeOpenIcon className="text-blue-600 h-6 w-6" />}
				helperText="All time vists"
				value={visits.toLocaleString() || ""}
				loading={false}
			/>
			<StatsCard
				title="Total Submissions"
				icon={<DashboardIcon className="text-yellow-600 w-6 h-6" />}
				helperText="All time submissions."
				value={submissions.toLocaleString() || ""}
				loading={false}
			/>
			<StatsCard
				title="Submissions rate"
				icon={<CursorArrowIcon className="text-green-600 w-6 h-6" />}
				helperText="visits that submitted form."
				value={submissionRate.toLocaleString() + "%" || ""}
				loading={false}
			/>
			<StatsCard
				title="Bounce rate"
				icon={<MixerVerticalIcon className="text-rose-600 h-6 w-6" />}
				helperText="Visits that leave without interacting."
				value={bounceRate.toLocaleString() + "%" || ""}
				loading={false}
			/>
			</div>

			<div className="border-y border-muted py-6 mt-8">
				<div className="container flex flex-col md:flex-row gap-6">
					<div className="space-y-4 flex-1">
						<FormLinkShare shareUrl={form.shareURL} />
						<div className="flex justify-end">
							<SaveTemplate formName={form.name} formContent={form.content} />
						</div>
					</div>
					<div className="flex-1">
						<FormSettings
							form={{
								id: form.id,
								passwordHash: form.passwordHash,
								thankYouMessage: form.thankYouMessage,
								redirectUrl: form.redirectUrl,
								closeDate: form.closeDate?.toISOString() ?? null,
								submissionLimit: form.submissionLimit,
								hasDuplicateProtection: form.hasDuplicateProtection,
							}}
						/>
					</div>
				</div>
			</div>

			<div className="container pt-10">
				<SubmissionsTable id={form.id} />
			</div>

			
		</>
	);
};

export default FormDetails;

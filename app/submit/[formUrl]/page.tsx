import { Metadata } from 'next';
import { GetFormContentByUrl } from '@/actions/form';
import { FormElementInstance } from '@/components/form-elements';
import FormSubmit from '@/components/form-submit';

export async function generateMetadata({ params }: { params: Promise<{ formUrl: string }> }): Promise<Metadata> {
	const { formUrl } = await params;
	const form = await GetFormContentByUrl(formUrl);
	return { title: form?.name || "Submit Form" };
}

const SubmitPage = async ({ params }: { params: Promise<{ formUrl: string }> }) => {
	const { formUrl } = await params;
	const form = await GetFormContentByUrl(formUrl);

	if (!form) throw new Error("form not found");

	const formContent = JSON.parse(form.content) as FormElementInstance[];
	return (
		<FormSubmit
			formUrl={formUrl}
			formName={form.name}
			content={formContent}
			passwordHash={form.passwordHash}
			thankYouMessage={form.thankYouMessage}
			redirectUrl={form.redirectUrl}
			closeDate={form.closeDate?.toISOString() ?? null}
			submissionLimit={form.submissionLimit}
			submissions={form.submissions}
			hasDuplicateProtection={form.hasDuplicateProtection}
		/>
	);
};

export default SubmitPage

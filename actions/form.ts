"use server";

import db from "@/lib/prisma";
import { formSchema, formSchemaType } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { subDays } from "date-fns";

export async function GetFormStats() {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const [stats, submissions] = await Promise.all([
		db.form.aggregate({
			where: { userId },
			_sum: { visits: true },
		}),
		db.formSubmission.count({
			where: {
				form: { userId },
			},
		}),
	]);

	const visits = stats._sum.visits ?? 0;
	const submissionRate = visits > 0 ? (submissions / visits) * 100 : 0;
	const bounceRate = visits > 0 ? 100 - submissionRate : 0;

	return { visits, submissions, submissionRate, bounceRate };
}

export async function CreateForm(data: formSchemaType) {
	const validation = formSchema.safeParse(data);
	if (!validation.success) throw new Error("form invalid");

	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const { name, description, content } = data;
	const form = await db.form.create({
		data: {
			userId,
			name,
			description,
			content: content || "[]",
		},
	});

	if (!form) throw new Error("something went wrong!");
	return form.id;
}

export async function GetForms() {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	return await db.form.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

export async function GetFormById(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	return await db.form.findFirst({
		where: { userId, id },
	});
}

export async function UpdateFormContent(id: string, jsonContent: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const response = await db.form.updateMany({
		where: { id, userId },
		data: { content: jsonContent },
	});

	if (response.count === 0) throw new Error("Form not found!");
	return response;
}

export async function UpdateForm(
	id: string,
	content: string,
	pages: string,
	name?: string,
) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const response = await db.form.updateMany({
		where: { id, userId },
		data: {
			content,
			pages,
			...(name !== undefined ? { name } : {}),
		},
	});

	if (response.count === 0) throw new Error("Form not found!");
	return response;
}

export async function UpdateFormBranding(
	id: string,
	accent: string,
	logo?: string,
) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const response = await db.form.updateMany({
		where: { id, userId },
		data: { accent, logo: logo ?? "" },
	});

	if (response.count === 0) throw new Error("Form not found!");
	return response;
}

export async function PublishForm(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const response = await db.form.updateMany({
		where: { id, userId },
		data: { published: true },
	});

	if (response.count === 0) throw new Error("Form not found!");
	return response;
}

export async function GetFormWithSubmissions(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	return await db.form.findFirst({
		where: { userId, id },
		include: { FormSubmission: true },
	});
}

export async function GetFormContentByUrl(formUrl: string) {
	const response = await db.form.update({
		where: { shareURL: formUrl, published: true },
		select: {
			id: true,
			content: true,
			name: true,
			accent: true,
			logo: true,
			passwordHash: true,
			thankYouMessage: true,
			redirectUrl: true,
			closeDate: true,
			submissionLimit: true,
			submissions: true,
			hasDuplicateProtection: true,
		},
		data: { visits: { increment: 1 } },
	});

	return response;
}

export async function SubmitForm(formUrl: string, content: string) {
	const form = await db.form.findFirst({
		where: { shareURL: formUrl, published: true },
		select: {
			id: true,
			userId: true,
			closeDate: true,
			submissionLimit: true,
			submissions: true,
		},
	});

	if (!form) throw new Error("Form not found!");
	if (form.closeDate && new Date() > form.closeDate) throw new Error("FORM_CLOSED");
	if (form.submissionLimit !== null && form.submissions >= form.submissionLimit)
		throw new Error("FORM_CLOSED");

	const formSubmission = await db.formSubmission.create({
		data: { formId: form.id, content },
	});

	const inbox = await db.inbox.upsert({
		where: { userId: form.userId },
		create: { userId: form.userId },
		update: {},
	});
	await db.formInbox.create({
		data: {
			inboxId: inbox.id,
			formId: form.id,
			submissionId: formSubmission.id,
		},
	});

	await db.form.update({
		where: { id: form.id },
		data: { submissions: { increment: 1 } },
	});
}

export async function GetInboxData() {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const inbox = await db.inbox.findUnique({
		where: { userId },
		include: {
			submissions: {
				orderBy: { answeredAt: "desc" },
				include: {
					form: { select: { id: true, name: true } },
					submission: true,
				},
			},
		},
	});

	const formSubmissions = await db.formSubmission.findMany({
		where: { form: { userId } },
		include: { form: { select: { id: true, name: true } } },
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	return {
		inbox: inbox ?? { submissions: [] },
		formSubmissions,
	};
}

export async function UpdateFormSettings(
	id: string,
	data: {
		password?: string;
		thankYouMessage?: string;
		redirectUrl?: string;
		closeDate?: string | null;
		submissionLimit?: number | null;
		hasDuplicateProtection?: boolean;
	}
) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const updateData: any = {};
	if (data.thankYouMessage !== undefined) updateData.thankYouMessage = data.thankYouMessage;
	if (data.redirectUrl !== undefined) updateData.redirectUrl = data.redirectUrl;
	if (data.closeDate !== undefined) updateData.closeDate = data.closeDate;
	if (data.submissionLimit !== undefined) updateData.submissionLimit = data.submissionLimit;
	if (data.hasDuplicateProtection !== undefined) updateData.hasDuplicateProtection = data.hasDuplicateProtection;
	if (data.password !== undefined) {
		updateData.passwordHash = data.password
			? hashPassword(data.password)
			: null;
	}

	const response = await db.form.updateMany({
		where: { id, userId },
		data: updateData,
	});

	if (response.count === 0) throw new Error("Form not found!");
}

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(password, salt, 64).toString("hex");
	return `${salt}:${hash}`;
}

export async function DeleteForm(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	await db.formSubmission.deleteMany({ where: { formId: id } });
	await db.form.delete({ where: { id, userId } });
}
// ponytail: deleteMany submissions first — no schema cascade needed

export async function ToggleFavorite(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const form = await db.form.findFirst({
		where: { id, userId },
		select: { isFavorite: true },
	});
	if (!form) return;

	await db.form.updateMany({
		where: { id, userId },
		data: { isFavorite: { set: !form.isFavorite } },
	});
}

export async function DeleteSubmission(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	await db.formSubmission.deleteMany({
		where: { id, form: { userId } },
	});
}

export async function DuplicateForm(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const source = await db.form.findFirst({ where: { id, userId } });
	if (!source) throw new Error("Form not found!");

	const copy = await db.form.create({
		data: {
			userId,
			name: `${source.name} (copy)`,
			description: source.description,
			content: source.content,
			pages: source.pages,
			published: false,
			isFavorite: false,
		},
	});

	return copy.id;
}

export async function VerifyFormPassword(formUrl: string, password: string): Promise<boolean> {
	const form = await db.form.findUnique({
		where: { shareURL: formUrl },
		select: { passwordHash: true },
	});
	if (!form?.passwordHash) return false;
	const [salt, hash] = form.passwordHash.split(":");
	try {
		const verifyHash = scryptSync(password, salt, 64).toString("hex");
		return timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
	} catch {
		return false;
	}
}

export async function GetFormAnalytics(id: string) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const form = await db.form.findUnique({
		where: { id, userId },
		include: { FormSubmission: true },
	});

	if (!form) throw new Error("Form not found!");

	const now = new Date();
	const start = subDays(now, 7);

	const buckets = Array.from({ length: 14 }, (_, i) => {
		const day = subDays(now, 13 - i);
		const key = day.toISOString().split("T")[0];
		const count = form.FormSubmission.filter(
			(s) => s.createdAt.toISOString().split("T")[0] === key,
		).length;
		return { date: key, submissions: count };
	});

	return {
		form: {
			name: form.name,
			visits: form.visits,
			submissions: form.FormSubmission.length,
			// updatedAt: form.updatedAt,
		},
		submissionCount: form.FormSubmission.length,
		funnel: {
			views: form.visits,
			// ponytail: no "started" event tracked yet; report equals submitted
			started: form.FormSubmission.length,
			submitted: form.FormSubmission.length,
		},
		trend: {
			from: start,
			to: now,
			submissions: form.FormSubmission.filter(
				(s) => s.createdAt >= start,
			).length,
		},
		chart: buckets,
	};
}

export async function GetGlobalInsights() {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const [totalForms, totalSubmissions, topForms] = await Promise.all([
		db.form.count({ where: { userId } }),
		db.formSubmission.count({ where: { form: { userId } } }),
		db.form.findMany({
			where: { userId },
			select: {
				name: true,
				visits: true,
				_count: { select: { FormSubmission: true } },
			},
			orderBy: { FormSubmission: { _count: "desc" } },
			take: 5,
		}),
	]);

	return {
		totalForms,
		totalSubmissions,
		topForms: topForms.map((f) => ({
			name: f.name,
			visits: f.visits,
			submissions: f._count.FormSubmission,
		})),
	};
}

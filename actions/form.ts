"use server";

import db from "@/lib/prisma";
import { formSchema, formSchemaType } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


export async function GetFormStats() {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	const [stats, submissions] = await Promise.all([
		db.form.aggregate({
			where: { userId },
			_sum: { visits: true },
		}),
		db.formSubmission.count({
			where: {
				form: {
					userId,
				},
			},
		}),
	]);

	const visits = stats._sum.visits ?? 0;
	const totalSubmissions = submissions ?? 0;

	const submissionRate = visits > 0 ? (totalSubmissions / visits) * 100 : 0;

	const bounceRate = visits > 0 ? 100 - submissionRate : 0;

	return {
		visits,
		submissions,
		submissionRate,
		bounceRate,
	};
}

export async function CreateForm(data: formSchemaType) {
	const validation = formSchema.safeParse(data);

	if (!validation.success) {
		throw new Error("form invalid");
	}
	// console.log("NAME ON SERVER", data.name);
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");

		// throw new UserNotFoundErr();
	}

	const { name, description } = data;
	const form = await db.form.create({
		data: {
			userId,
			name,
			description,
		},
	});

	if (!form) {
		throw new Error("something went wrong!");
	}

	return form.id;
}

export async function GetForms() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");

		// throw new UserNotFoundErr();
	}

	const forms = await db.form.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return forms;
}

export async function GetFormById(id: string) {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	return await db.form.findFirst({
		where: {
			userId,
			id,
		},
	});
}

export async function UpdateFormContent(id: string, jsonContent: string) {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	const form = await db.form.findFirst({
		where: {
			id,
			userId,
		},
		select: {
			id: true,
		},
	});

	if (!form) {
		throw new Error("Form not found!");
	}

	const response = await db.form.update({
		where: {
			id: form.id,
		},
		data: {
			content: jsonContent,
		},
	});
	return response;
}

export async function PublishForm(id: string) {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	const form = await db.form.findFirst({
		where: {
			id,
			userId,
		},
		select: {
			id: true,
		},
	});

	if (!form) {
		throw new Error("Form not found!");
	}

	const response = await db.form.update({
		where: {
			id: form.id,
		},
		data: {
			published: true,
		},
	});

	return response;
}

export async function GetFormWithSubmissions(id: string) {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	const response = await db.form.findFirst({
		where: {
			userId,
			id,
		},
		include: {
			FormSubmission: true,
		},
	});

	return response;
}

export async function GetFormContentByUrl(formUrl: string) {
	const response = await db.form.update({
		where: {
			shareURL: formUrl,
		},
		select: {
			content: true,
		},
		data: {
			visits: {
				increment: 1,
			},
		},
	});

	return response;
}

export async function SubmitForm(formUrl: string, content: string) {
	const form = await db.form.findFirst({
		where: {
			shareURL: formUrl,
			published: true,
		},
		select: {
			id: true,
		},
	});

	if (!form) {
		throw new Error("Form not found!");
	}

	const response = await db.formSubmission.create({
		data: {
			formId: form.id,
			content,
		},
	});
}

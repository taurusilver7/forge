"use server";

import db from "@/lib/prisma";
import { formSchema, formSchemaType } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

class UserNotFoundErr extends Error {}

export async function GetFormStats() {
	const user = await currentUser();
	if (!user) {
		throw new UserNotFoundErr();
		// redirect("/sign-in");
	}

	const stats = await db.form.aggregate({
		where: {
			userId: user.id,
		},
		_sum: {
			visits: true,
			submissions: true,
		},
	});

	const visits = stats._sum.visits ?? 0;
	const submissions = stats._sum.submissions ?? 0;

	let submissionRate = 0;

	if (visits > 0) {
		submissionRate = (submissions / visits) * 100;
	}
	const bounceRate = 100 - submissionRate;

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
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");

		// throw new UserNotFoundErr();
	}

	const { name, description } = data;
	const form = await db.form.create({
		data: {
			userId: user.id,
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
	const user = await currentUser();

	if (!user) {
		redirect("/sign-in");

		// throw new UserNotFoundErr();
	}

	const forms = await db.form.findMany({
		where: {
			userId: user.id,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return forms;
}

export async function GetFormById(id: string) {
	const user = await currentUser();

	if (!user) {
		redirect("/sign-in");

		// throw new UserNotFoundErr();
	}

	return await db.form.findUnique({
		where: {
			userId: user.id,
			id,
		},
	});
}

export async function UpdateFormContent(id: string, jsonContent: string) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const response = await db.form.update({
		where: {
			userId: user.id,
			id,
		},
		data: {
			content: jsonContent,
		},
	});
	return response;
}

export async function PublishForm(id: string) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const response = await db.form.update({
		where: {
			userId: user.id,
			id,
		},
		data: {
			published: true,
		},
	});

	return response;
}

export async function GetFormWithSubmissions(id: string) {
	const user = await currentUser();
	if (!user) {
		redirect("/sign-in");
	}

	const response = await db.form.findUnique({
		where: {
			userId: user.id,
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
		select: {
			content: true,
		},
		where: {
			shareURL: formUrl,
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
	const response = await db.form.update({
		where: {
			shareURL: formUrl,
			published: true,
		},
		data: {
			submissions: {
				increment: 1,
			},
			FormSubmission: {
				create: {
					content,
				},
			},
		},
	});
}

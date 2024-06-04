"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs";

class UserNotFoundErr extends Error {};

// 
export async function GetFormStats() {
	const user = await currentUser();
	if (!user) {
		throw new UserNotFoundErr();
	}

	const stats = await prisma.form.aggregate({
		where: {
			userId: user.id,
		},
		_sum: {
			visits: true,
			submission: true,
		},
	});

	const visits = stats._sum.visits || 0;
	const submissions = stats._sum.submission || 0;

	let submissionRate = 0;

	if (visits > 0) {
		submissionRate = (submissions / visits) * 100;
	}
	const bounceRate = 100 - submissionRate;

	return {
		visits,
		submissions,
		bounceRate
	};
}

"use server";

import db from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function SaveTemplate(name: string, description: string, content: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await db.formTemplate.create({
    data: { userId, name, description, content },
  });
}

export async function GetUserTemplates() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return db.formTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      content: true,
      createdAt: true,
    },
  });
}

export async function DeleteTemplate(id: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await db.formTemplate.deleteMany({
    where: { id, userId },
  });
}

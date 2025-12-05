import React from "react";
import { Skeleton } from "./ui/skeleton";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import {
	EyeOpenIcon,
	ViewVerticalIcon,
	MagicWandIcon,
	DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import Link from "next/link";
import { GetForms } from "@/actions/form";
import { Form } from "@prisma/client";
import { Badge } from "./ui/badge";
import { formatDistance } from "date-fns";

const FormCards = async () => {
	const forms = (await GetForms()) ?? [];
	return (
		<>
			{forms.map((form) => (
				<FormCard key={form.id} form={form} />
			))}
		</>
	);
};

export default FormCards;

export const FormCardSkeleton = () => {
	return <Skeleton className="border-2 border-primary/20 h-48 w-full" />;
};

const FormCard = ({ form }: { form: Form }) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 justify-between">
					<span className="truncate font-bold uppercase">{form.name}</span>
					{form.published && <Badge>Published</Badge>}
					{!form.published && <Badge variant="destructive">Draft</Badge>}
				</CardTitle>
				<CardDescription className="flex items-center justify-between text-xs text-muted-foreground">
					{formatDistance(form.createdAt, new Date(), { addSuffix: true })}
					{form.published && (
						<span className="flex items-center gap-2">
							<EyeOpenIcon className="text-muted-foreground" />
							<span>{form.visits.toLocaleString()}</span>
							<ViewVerticalIcon className="text-muted-foreground" />
							<span>{form.submissions.toLocaleString()}</span>
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="h-5 truncate text-sm text-muted-foreground">
				{form.description || "No Description"}
			</CardContent>
			<CardFooter>
				{form.published && (
					<Button asChild className="w-full mt-2 text-md gap-2">
						<Link href={`/forms/${form.id}`}>
							View Submission <DoubleArrowRightIcon />
						</Link>
					</Button>
				)}
				{!form.published && (
					<Button
						asChild
						variant={"secondary"}
						className="w-full mt-2 text-md gap-2"
					>
						<Link href={`/builder/${form.id}`}>
							<MagicWandIcon />
							Edit
						</Link>
					</Button>
				)}
			</CardFooter>
		</Card>
	);
};

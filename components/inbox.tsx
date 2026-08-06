"use client";

import { useMemo, useState } from "react";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { GetInboxData } from "@/actions/form";

export function InboxView({
	data,
}: {
	data: Awaited<ReturnType<typeof GetInboxData>>;
}) {
	const [search, setSearch] = useState("");
	const q = search.trim().toLowerCase();

	const entries = useMemo(() => {
		const values = (content: string) =>
			Object.entries(JSON.parse(content) as Record<string, unknown>)
				.filter(([k]) => !k.startsWith("_"))
				.map(([, v]) => String(v));

		const src = [
			...data.inbox.submissions.map((s) => ({
				id: s.submission.id,
				form: s.form.name,
				at: s.answeredAt,
				content: values(s.submission.content),
			})),
			...data.formSubmissions.map((s) => ({
				id: s.id,
				form: s.form.name,
				at: s.createdAt,
				content: values(s.content),
			})),
		];
		if (!q) return src;
		return src.filter((e) =>
			(e.form + " " + e.content.join(" ")).toLowerCase().includes(q),
		);
	}, [data, q]);

	return (
		<div className="space-y-3">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search inbox…"
					className="pl-9"
				/>
			</div>
			{entries.length === 0 ? (
				<p className="text-muted-foreground text-sm text-center py-8">
					No submissions yet.
				</p>
			) : (
				<div className="space-y-2">
					{entries.map((e) => (
						<details
							key={e.id}
							className="group rounded-md border px-3 py-2"
						>
							<summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
								<Badge variant="secondary">{e.form}</Badge>
								<span className="truncate text-sm">{e.content[0] ?? "—"}</span>
								<span className="text-xs text-muted-foreground ml-auto shrink-0">
									{formatDistance(new Date(e.at), new Date(), {
										addSuffix: true,
									})}
								</span>
							</summary>
							<div className="mt-2 space-y-1 border-t pt-2">
								{e.content.map((v, i) => (
									<div key={i} className="text-sm break-words">
										{v}
									</div>
								))}
							</div>
						</details>
					))}
				</div>
			)}
		</div>
	);
}

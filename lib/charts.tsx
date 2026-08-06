"use client";

export type ChartPoint = { date: string; submissions: number };

const W = 560;
const H = 180;
const PAD = 24;

export function SubmissionChart({ points }: { points: ChartPoint[] }) {
	const max = Math.max(1, ...points.map((p) => p.submissions));
	const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, points.length - 1);
	const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
	const path = points
		.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.submissions)}`)
		.join(" ");
	const area = `${path} L${x(points.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`;

	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full">
			{Array.from({ length: 4 }, (_, i) => {
				const gy = PAD + (i * (H - PAD * 2)) / 3;
				return (
					<line
						key={i}
						x1={PAD}
						y1={gy}
						x2={W - PAD}
						y2={gy}
						stroke="currentColor"
						strokeOpacity={0.1}
					/>
				);
			})}
			<path d={area} fill="currentColor" fillOpacity={0.08} />
			<path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
			{points.map((p, i) => (
				<circle
					key={p.date}
					cx={x(i)}
					cy={y(p.submissions)}
					r={3}
					fill="currentColor"
				/>
			))}
			{points.length > 0 && (
				<>
					<text
						x={PAD}
						y={H - 8}
						fontSize={10}
						fill="currentColor"
						fillOpacity={0.6}
					>
						{points[0].date}
					</text>
					<text
						x={W - PAD}
						y={H - 8}
						textAnchor="end"
						fontSize={10}
						fill="currentColor"
						fillOpacity={0.6}
					>
						{points[points.length - 1].date}
					</text>
				</>
			)}
		</svg>
	);
}

export function FunnelChart({ data }: { data: { label: string; value: number }[] }) {
	const max = Math.max(1, ...data.map((d) => d.value));
	return (
		<div className="space-y-2">
			{data.map((d) => (
				<div key={d.label} className="flex items-center gap-2">
					<span className="text-xs w-20 shrink-0">{d.label}</span>
					<div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
						<div
							className="h-full bg-primary/70 rounded-sm"
							style={{ width: `${(d.value / max) * 100}%` }}
						/>
					</div>
					<span className="text-xs w-8 text-right tabular-nums">
						{d.value}
					</span>
				</div>
			))}
		</div>
	);
}

export type CsvCell = string | number | boolean | null | undefined;

export function toCsv(rows: CsvCell[][]): string {
	const escape = (value: string): string =>
		/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
	return rows
		.map((row) => row.map((cell) => escape(String(cell ?? ""))).join(","))
		.join("\r\n");
}

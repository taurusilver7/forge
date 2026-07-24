"use client";

import useDesigner from "@/hooks/useDesigner";
import { Condition, FormElementInstance } from "./form-elements";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, X } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export function ConditionEditor({
	element,
}: {
	element: FormElementInstance;
}) {
	const { elements, updateElement } = useDesigner();
	const others = elements.filter((e) => e.id !== element.id);
	const condition = (element.extraAttributes as any)?.condition as
		| Condition
		| undefined;

	const setCondition = (partial: Partial<Condition>) => {
		const updated = { ...element };
		(updated.extraAttributes as any).condition = {
			...condition,
			...partial,
			action: condition?.action || "show",
			fieldId: condition?.fieldId || others[0]?.id || "",
			operator: condition?.operator || "equals",
			value: condition?.value || "",
			...(partial.fieldId ? { fieldId: partial.fieldId } : {}),
			...(partial.operator ? { operator: partial.operator } : {}),
			...(partial.value !== undefined ? { value: partial.value } : {}),
		};
		updateElement(element.id, updated);
	};

	const clearCondition = () => {
		const updated = { ...element };
		delete (updated.extraAttributes as any).condition;
		updateElement(element.id, updated);
	};

	return (
		<div className="space-y-2 border rounded p-3">
			<div className="flex items-center justify-between">
				<Label>Visibility</Label>
				{condition && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearCondition}
					>
						<X className="h-3 w-3" />
					</Button>
				)}
			</div>
			{condition ? (
				<div className="space-y-2">
					<Select
						value={condition.action}
						onValueChange={(v) =>
							setCondition({ action: v as "show" | "hide" })
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="show">Show</SelectItem>
							<SelectItem value="hide">Hide</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={condition.fieldId}
						onValueChange={(v) => setCondition({ fieldId: v })}
					>
						<SelectTrigger>
							<SelectValue placeholder="When field..." />
						</SelectTrigger>
						<SelectContent>
							{others.map((el) => (
								<SelectItem key={el.id} value={el.id}>
									{el.extraAttributes?.label || el.type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={condition.operator}
						onValueChange={(v) =>
							setCondition({
								operator: v as Condition["operator"],
							})
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="equals">equals</SelectItem>
							<SelectItem value="not_equals">not equals</SelectItem>
							<SelectItem value="contains">contains</SelectItem>
							<SelectItem value="empty">is empty</SelectItem>
							<SelectItem value="not_empty">is not empty</SelectItem>
						</SelectContent>
					</Select>
					{condition.operator !== "empty" &&
						condition.operator !== "not_empty" && (
							<Input
								value={condition.value}
								onChange={(e) =>
									setCondition({ value: e.target.value })
								}
								placeholder="Value"
							/>
						)}
				</div>
			) : (
				<Button
					variant="outline"
					size="sm"
					className="w-full"
					onClick={() =>
						setCondition({
							action: "show",
							fieldId: others[0]?.id || "",
							operator: "equals",
							value: "",
						})
					}
				>
					<Plus className="h-3 w-3 mr-1" /> Add Condition
				</Button>
			)}
		</div>
	);
}

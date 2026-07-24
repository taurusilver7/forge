import { Condition } from "@/components/form-elements";

export function checkCondition(cond: Condition, actualValue: string): boolean {
	switch (cond.operator) {
		case "equals":
			return actualValue === cond.value;
		case "not_equals":
			return actualValue !== cond.value;
		case "contains":
			return actualValue.includes(cond.value);
		case "empty":
			return actualValue.length === 0;
		case "not_empty":
			return actualValue.length > 0;
		default:
			return true;
	}
}

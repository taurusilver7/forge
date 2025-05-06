// Sidebar Button Element + Sidebar Element Drag Overlay

import React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { FormElement } from "./form-elements";
import { useDraggable } from "@dnd-kit/core";

const SidebarElement = ({ formElement }: { formElement: FormElement }) => {
	const { label, icon: Icon } = formElement.designerBtnElement;
	const draggable = useDraggable({
		id: `designer-btn-${formElement.type}`,
		data: {
			type: formElement.type,
			isDesignerBtnElement: true,
		},
	});
	return (
		<Button
			ref={draggable.setNodeRef}
			{...draggable.listeners}
			{...draggable.attributes}
			variant="outline"
			className={cn(
				"flex flex-col gap-2 h-32 w-32 cursor-grab",
				draggable.isDragging && "ring-2 ring-primary"
			)}
		>
			<Icon className="h-8 w-8 text-primary cursor-grab" />
			<p className="text-xs">{label}</p>
		</Button>
	);
};

export const SidebarElementDragOverlay = ({
	formElement,
}: {
	formElement: FormElement;
}) => {
	const { label, icon: Icon } = formElement.designerBtnElement;

	return (
		<Button
			variant="outline"
			className={cn("flex flex-col gap-2 h-32 w-32 cursor-grab")}
		>
			<Icon className="h-8 w-8 text-primary cursor-grab" />
			<p className="text-xs">{label}</p>
		</Button>
	);
};

export default SidebarElement;

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
				"flex gap-2 w-full cursor-grab justify-start px-3",
				draggable.isDragging && "ring-2 ring-primary"
			)}
		>
			<Icon className="size-4 text-primary cursor-grab shrink-0" />
			<p className="text-xs truncate">{label}</p>
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
			className={cn("flex gap-2 w-full cursor-grab justify-start px-3")}
		>
			<Icon className="size-4 text-primary cursor-grab shrink-0" />
			<p className="text-xs truncate">{label}</p>
		</Button>
	);
};

export default SidebarElement;

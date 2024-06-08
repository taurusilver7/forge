// A wrapper overlay to render the drag elements from the Designer sidebar (sidebar elements).

import { SidebarElementDragOverlay } from "@/components/sidebar-element";
import { Active, DragOverlay, useDndMonitor } from "@dnd-kit/core";
import React, { useState } from "react";
import { FormElements, ElementType } from "@/components/form-elements";

const DragOverlayWrapper = () => {
	const [draggedItem, setDraggedItem] = useState<Active | null>(null);
	useDndMonitor({
		onDragStart: (event) => {
			// console.log("Drag ITEM", event);
			setDraggedItem(event.active);
		},
		onDragCancel: (event) => {
			setDraggedItem(null);
		},
		onDragEnd: (event) => {
			setDraggedItem(null);
		},
	});

	if (!draggedItem) return null;

	let node = <div>No drag overlay</div>;

	const isSidebarElement = draggedItem?.data?.current?.isDesignerBtnElement;

	if (isSidebarElement) {
		const type = draggedItem?.data?.current?.type as ElementType;
		node = <SidebarElementDragOverlay formElement={FormElements[type]} />;
	}

	return <DragOverlay>{node}</DragOverlay>;
};

export default DragOverlayWrapper;

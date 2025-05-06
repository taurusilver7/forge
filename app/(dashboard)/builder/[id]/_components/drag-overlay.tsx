// A wrapper overlay to render the drag elements from the Designer sidebar (sidebar elements).

import React, { useState } from "react";
import { SidebarElementDragOverlay } from "@/components/sidebar-element";
import { Active, DragOverlay, useDndMonitor } from "@dnd-kit/core";
import { FormElements, ElementType } from "@/components/form-elements";
import useDesigner from "@/hooks/useDesigner";

const DragOverlayWrapper = () => {
	const { elements } = useDesigner();
	const [draggedItem, setDraggedItem] = useState<Active | null>(null);

	useDndMonitor({
		onDragStart: (event) => {
			// console.log("Drag ITEM", event);
			setDraggedItem(event.active);
		},
		onDragEnd: () => {
			setDraggedItem(null);
		},
		onDragCancel: () => {
			setDraggedItem(null);
		},
	});

	if (!draggedItem) return null;
	let node = <div>No drag overlay</div>;

	// is the dragged item a sidebar designer element?
	const isSidebarElement: boolean =
		draggedItem.data.current?.isDesignerBtnElement ?? false;

	if (isSidebarElement) {
		const type = draggedItem?.data?.current?.type as ElementType;
		node = <SidebarElementDragOverlay formElement={FormElements[type]} />;
	}

	const isDesignerElement: boolean =
		draggedItem?.data?.current?.isDesignerElement ?? false;

	// console.log("draggedItem", draggedItem);
	// console.log("isSidebarElement", isSidebarElement);
	// console.log("isDesignerElement", isDesignerElement);

	if (isDesignerElement) {
		const elementId = draggedItem?.data?.current?.elementId;
		const element = elements.find((el) => el.id === elementId);
		if (!element) {
			node = <div>no element</div>;
		} else {
			const DesignerElementComponent =
				FormElements[element.type].designerComponent;

			node = (
				<div className="flex bg-accent rounded-md h-32 w-full py-2 px-4 opacity-80">
					<DesignerElementComponent elementInstance={element} />
				</div>
			);
		}
	}

	return <DragOverlay>{node}</DragOverlay>;
};

export default DragOverlayWrapper;

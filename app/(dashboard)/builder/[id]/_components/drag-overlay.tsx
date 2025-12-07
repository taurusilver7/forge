/**
 * DragOverlayWrapper Component
 * 
 * PURPOSE:
 * Provides visual feedback during drag operations by rendering a preview/ghost image
 * of the item being dragged. Displays above other elements to show drag trajectory.
 * 
 * FEATURES:
 * - Tracks active drag item state
 * - Renders different overlay based on drag type:
 *   - Sidebar element drag -> Shows form field preview
 *   - Designer element drag -> Shows existing form element being reordered
 * - Automatically hides when drag ends/cancels
 * - Prevents rendering when no active drag
 * 
 * FLOW:
 * 1. useDndMonitor listens for drag lifecycle events
 * 2. onDragStart: Captures the item being dragged
 * 3. Determines drag type via dnd-kit active.data:
 *    - isDesignerBtnElement -> Sidebar field being added
 *    - isDesignerElement -> Existing form element being moved
 * 4. Renders appropriate overlay component for visual feedback
 * 5. onDragEnd/onDragCancel: Clears drag state and hides overlay
 * 
 * DRAG TYPES HANDLED:
 * - Sidebar button drag: Shows preview of form field being added
 * - Designer element drag: Shows preview of existing element being reordered
 * 
 * ERROR HANDLING:
 * - Returns null if no active drag (prevents unnecessary rendering)
 * - Validates element exists before rendering designer element overlay
 * - Falls back to "no drag overlay" message if type cannot be determined
 */

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
	const isSidebarBtnElement: boolean =
		draggedItem.data?.current?.isDesignerBtnElement;

	if (isSidebarBtnElement) {
		const type = draggedItem?.data?.current?.type as ElementType;
		node = <SidebarElementDragOverlay formElement={FormElements[type]} />;
	}

	const isDesignerElement: boolean =
		draggedItem?.data?.current?.isDesignerElement;

	// console.log("draggedItem", draggedItem);
	// console.log("isSidebarElement", isSidebarElement);
	// console.log("isDesignerElement", isDesignerElement);

	if (isDesignerElement) {
		const elementId = draggedItem?.data?.current?.elementId;
		const element = elements.find((el) => el.id === elementId);
		if (!element) node = <div>no element</div>;
		else {
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

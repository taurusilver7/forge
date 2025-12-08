/**
 * Designer Component
 *
 * PURPOSE:
 * Main canvas/workspace where users visually design and arrange form elements.
 * Handles drag-and-drop of form fields, element selection, and element removal.
 *
 * FEATURES:
 * - Drop zone for adding new form elements from the sidebar
 * - Drag-and-drop to reorder elements within the designer
 * - Click to select elements for editing properties
 * - Hover to reveal delete button for each element
 * - Visual feedback for drag-over zones (top/bottom halves for insertion positioning)
 * - Empty state messaging
 *
 * FLOW:
 * 1. DndContext enables drag-and-drop via dnd-kit library
 * 2. Main Designer div is a droppable area that accepts sidebar elements
 * 3. useDndMonitor tracks all drag events and handles:
 *    - Adding new elements from sidebar (stage 1)
 *    - Adding sidebar elements over existing elements (stage 2)
 *    - Reordering designer elements by dragging (stage 3)
 * 4. DesignerElementWrapper renders each element with interactivity
 * 5. DesignerSidebar shows available form field types to drag
 *
 * ELEMENT INTERACTION:
 * - Click element -> Select it (trigger properties panel)
 * - Drag left handle -> Reorder element
 * - Hover -> Show delete button
 * - Click trash icon -> Remove element from form
 *
 * ERROR HANDLING:
 * - Throws error if element not found during reordering (defensive check)
 * - Validates droppable target before processing drop events
 * - Returns null during drag to prevent double-rendering
 */

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { idGenerator } from "@/lib/id-generator";
import {
	DragEndEvent,
	useDndMonitor,
	useDraggable,
	useDroppable,
} from "@dnd-kit/core";

import {
	ElementType,
	FormElementInstance,
	FormElements,
} from "@/components/form-elements";
import DesignerSidebar from "./designer-sidebar";
import { Button } from "@/components/ui/button";
import { BiSolidTrash } from "react-icons/bi";
import useDesigner from "@/hooks/useDesigner";

const Designer = () => {
	// Add element from sidebar to the designer in builder.
	const {
		elements,
		addElement,
		removeElement,
		selectedElement,
		setSelectedElement,
	} = useDesigner();
	const droppable = useDroppable({
		id: "designer-drop-area",
		data: {
			isDesignerDropArea: true,
		},
	});

	// console.log("Droppable", droppable);

	useDndMonitor({
		onDragEnd: (event: DragEndEvent) => {
			const { active, over } = event;

			if (!active || !over) return;

			// 1.  Drag & Drop for Sidebar-Element (Text, Number) to dropzone area.
			// 2.  Drag & Drop a Sidebar Element over a Design-Element (Already in the dropzone)
			// 3.  Drag & Drop a Designer Element over another Designer-Element in the dropzone.

			const isDesignerBtnElement: boolean =
				active?.data?.current?.isDesignerBtnElement ?? false;
			const isDroppingOverDesignDropArea: boolean =
				over?.data?.current?.isDesignerDropArea;

			//! First case: Dropping Sidebar-Elements over designer dropzone
			if (isDesignerBtnElement && isDroppingOverDesignDropArea) {
				const type = active?.data?.current?.type;
				const newElement = FormElements[type as ElementType].construct(
					idGenerator()
				);
				addElement(elements.length, newElement);
				// add new element at the bottom instead of top; b/c of element.length
				return;
			}

			//! Second case: dropping sidebar-elements over designer-elements (from sidebar over onto a element in dropzone)
			const isDroppingOverDesignerElementTopHalf: boolean =
				over.data?.current?.isTopHalfDesignerElement ?? false;
			const isDroppingOverDesignerElementBottomHalf: boolean =
				over.data?.current?.isBottomHalfDesignerElement ?? false;

			// check whether dropping over one of the two droppable halves.
			const isDroppingOverDesignerElement =
				isDroppingOverDesignerElementBottomHalf ||
				isDroppingOverDesignerElementTopHalf;

			const droppingSidebarBtnOverDesignerElement =
				isDesignerBtnElement && isDroppingOverDesignerElement;

			if (droppingSidebarBtnOverDesignerElement) {
				const type = active?.data?.current?.type;
				const newElement = FormElements[type as ElementType].construct(
					idGenerator()
				);
				// check where we're dropping the element
				const overId = over?.data?.current?.elementId;
				const overElementIndex = elements.findIndex(
					(el) => el.id === overId
				);

				if (overElementIndex === -1) {
					throw new Error("Element not found!");
				}

				let indexForNewElement = overElementIndex; // if dropping over top half of element

				if (isDroppingOverDesignerElementBottomHalf) {
					indexForNewElement = overElementIndex + 1; // if dropping over bottom half of element
				}
				addElement(indexForNewElement, newElement);
				return;
			}

			//! third case: dragging designer-elements over another designer-elments
			const isDraggingDesignerElement =
				active?.data?.current?.isDesignerElement;

			const isDraggingDesignerElementOverAnotherDesignerElement =
				isDroppingOverDesignerElement && isDraggingDesignerElement;

			if (isDraggingDesignerElementOverAnotherDesignerElement) {
				const activeId = active.data?.current?.elementId;
				const overId = over?.data?.current?.elementId;

				const activeElementIndex = elements.findIndex(
					(el) => el.id === activeId
				);
				const overElementIndex = elements.findIndex(
					(el) => el.id === overId
				);

				if (activeElementIndex === -1 || overElementIndex === -1) {
					throw new Error("Element not found");
				}

				const activeElement = { ...elements[activeElementIndex] };
				removeElement(activeId); // remove the dragging element from its initial position

				let indexForNewElement = overElementIndex; // dropping over top half of element
				if (isDroppingOverDesignerElementBottomHalf) {
					indexForNewElement = overElementIndex + 1; // dropping over bottom half of element
				}

				addElement(indexForNewElement, activeElement);
			}
		},
	});
	return (
		<div className="h-full w-full flex p-1">
			<div
				className="p-2 w-full"
				onClick={() => {
					if (selectedElement) setSelectedElement(null);
				}}
			>
				<div
					ref={droppable.setNodeRef}
					className={cn(
						"bg-background max-w-5xl lg:max-w-6xl mx-auto h-full rounded-xl flex flex-col flex-grow items-center justify-start flex-1 overflow-y-auto",
						droppable.isOver && "ring-3 ring-primary ring-inset"
					)}
				>
					{/* drop position overlay in UI only for top element */}
					{droppable.isOver && elements.length === 0 && (
						<div className="w-full p-4">
							<div className="bg-primary/20 h-32 rounded-md" />
						</div>
					)}
					{!droppable.isOver && elements.length === 0 && (
						<p className="text-3xl text-muted-foreground flex flex-grow items-center font-bold">
							Drop here
						</p>
					)}

					{elements.length > 0 && (
						<div className="p-4 w-full gap-2 flex flex-col">
							{elements.map((element) => (
								<DesignerElementWrapper
									key={element.id}
									element={element}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			<DesignerSidebar />
		</div>
	);
};

export default Designer;

function DesignerElementWrapper({ element }: { element: FormElementInstance }) {
	const { removeElement, selectedElement, setSelectedElement } = useDesigner();
	const [mouseIsOver, setMouseIsOver] = useState<boolean>(false);

	const topHalf = useDroppable({
		id: element.id + "-top",
		data: {
			type: element.type,
			elementId: element.id,
			isTopHalfDesignerElement: true,
		},
	});
	const bottomHalf = useDroppable({
		id: element.id + "-bottom",
		data: {
			type: element.type,
			elementId: element.id,
			isBottomHalfDesignerElement: true,
		},
	});

	const draggable = useDraggable({
		id: element.id + "-drag-handler",
		data: {
			type: element.type,
			elementId: element.id,
			isDesignerElement: true,
		},
	});

	// remove the element from stack while dragging
	if (draggable?.isDragging) return null;

	const DesignerElement = FormElements[element.type].designerComponent;
	// console.log("SELECTED ELEMENT", selectedElement);

	return (
		<div
			className="relative h-32 flex flex-col text-foreground hover:cursor-pointer rounded-md ring-1 ring-accent ring-inset"
			ref={draggable.setNodeRef}
			onMouseEnter={() => {
				setMouseIsOver(true);
			}}
			onMouseLeave={() => {
				setMouseIsOver(false);
			}}
			onClick={(e) => {
				e.stopPropagation();
				setSelectedElement(element);
			}}
		>
			<div
				ref={topHalf.setNodeRef}
				className={cn("absolute w-full h-1/2 rounded-t-md")}
			/>
			<div
				ref={bottomHalf.setNodeRef}
				className={cn("absolute bottom-0 w-full h-1/2 rounded-b-md")}
			/>

			{mouseIsOver && (
				<>
					<div
						className="absolute left-0 top-0 h-full w-10/12 md:w-11/12 lg:w-[95%] cursor-grab z-40 hover:bg-primary/10"
						{...draggable.listeners}
						{...draggable.attributes}
					/>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
						<p className="text-muted-foreground text-sm">
							Click for properties or drag to move
						</p>
					</div>

					<div className="absolute right-0 h-full">
						<Button
							className="rounded-l-none flex justify-items-center h-full border rounded-md bg-orange-500 hover:bg-orange-600"
							variant={"outline"}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								removeElement(element.id);
							}}
						>
							<BiSolidTrash className="h-6 w-6" />
						</Button>
					</div>
				</>
			)}

			{topHalf.isOver && (
				<div className="absolute top-0 w-full rounded-md h-1 bg-primary rounded-b-none" />
			)}
			<div
				className={cn(
					"flex w-full h-32 items-center rounded-md bg-accent/40 px-4 py-2 pointer-events-none opacity-100",
					mouseIsOver && "opacity-30"
				)}
			>
				<DesignerElement elementInstance={element} />
			</div>
			{bottomHalf.isOver && (
				<div className="absolute bottom-0 w-full rounded-md h-1 bg-primary rounded-t-none" />
			)}
		</div>
	);
}

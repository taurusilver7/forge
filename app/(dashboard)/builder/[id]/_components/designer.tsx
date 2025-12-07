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

			const isDesignerBtnElement: boolean =
				active?.data?.current?.isDesignerBtnElement ?? false;
			const isDroppingOverDesignDropArea =
				over?.data?.current?.isDesignerDropArea ?? false;

			// First Step: Dropping Elements
			if (isDesignerBtnElement && isDroppingOverDesignDropArea) {
				const type = active?.data?.current?.type;
				const newElement = FormElements[type as ElementType].construct(
					idGenerator()
				);
				addElement(elements.length, newElement);
				return;
			}

			// Second step: dragging elements over sidebar elements
			const isDroppingOverDesignerElementTopHalf =
				over.data?.current?.isTopHalfDesignElement;
			const isDroppingOverDesignerElementBottomHalf =
				over.data?.current?.isBottomHalfDesignElement;

			const isDroppingOverDesignerElement =
				isDroppingOverDesignerElementBottomHalf |
				isDroppingOverDesignerElementTopHalf;

			const droppingSidebarBtnOverDesignerElement =
				isDesignerBtnElement && isDroppingOverDesignerElement;

			if (droppingSidebarBtnOverDesignerElement) {
				const type = active?.data?.current?.type;
				const newElement = FormElements[type as ElementType].construct(
					idGenerator()
				);
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

			// third step: dragging elements over designer elments
			const isDraggingDesignerElement =
				active?.data?.current?.isDesignerElement;

			const isDraggingDsgnEleOverAnthrDsgnEle =
				isDroppingOverDesignerElement && isDraggingDesignerElement;
			if (isDraggingDsgnEleOverAnthrDsgnEle) {
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
				removeElement(activeId);

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
						"bg-background max-w-5xl m-auto h-full rounded-xl flex flex-col flex-grow items-center justify-start flex-1 overflow-y-auto",
						droppable.isOver && "ring-5 ring-primary ring-inset"
					)}
				>
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
	const { removeElement, setSelectedElement } = useDesigner();
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

	if (draggable?.isDragging) return null;

	const DesignerElement = FormElements[element.type].designerComponent;

	return (
		<div
			className="relative h-32 flex flex-col text-foreground hover:cursor-pointer rounded-md ring-1 ring-accent ring-inset"
			ref={draggable.setNodeRef}
			{...draggable.listeners}
			{...draggable.attributes}
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
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
						<p className="text-muted-foreground text-sm">
							Click for properties or drag to move
						</p>
					</div>
					<div className="absolute right-0 h-full z-50">
						<Button
							className="rounded-l-none flex justify-items-center h-full border rounded-md bg-orange-500"
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
				<div className="absolute top-0 w-full rounded-md h-2 bg-primary rounded-b-none" />
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
				<div className="absolute bottom-0 w-full rounded-md h-2 bg-primary rounded-t-none" />
			)}
		</div>
	);
}

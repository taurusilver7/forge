"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";
import DesignerSidebar from "./designer-sidebar";
import { DragEndEvent, useDndMonitor, useDroppable } from "@dnd-kit/core";
import {
	ElementType,
	FormElementInstance,
	FormElements,
} from "@/components/form-elements";
import useDesigner from "@/hooks/useDesigner";
import { idGenerator } from "@/lib/id-generator";

const Designer = () => {
	const { elements, addElement } = useDesigner();
	const droppable = useDroppable({
		id: "designer-drop-area",
		data: {
			isDesignerDropArea: true,
		},
	});

	console.log("ELEMENTs", elements);

	useDndMonitor({
		onDragEnd: (event: DragEndEvent) => {
			const { active, over } = event;

			if (!active || !over) return;

			const isDesignerBtnElement =
				active?.data?.current?.isDesignerBtnElement;

			if (isDesignerBtnElement) {
				const type = active?.data?.current?.type;
				const newElement = FormElements[type as ElementType].construct(
					idGenerator()
				);
				addElement(0, newElement);
				console.log("NEW ELEMENT", newElement);
			}

			// console.log("DRAG END", event);
		},
	});
	return (
		<div className="h-full w-full flex p-1">
			<div className="p-2 w-full">
				<div
					ref={droppable.setNodeRef}
					className={cn(
						"bg-background max-w-4xl h-full rounded-xl flex flex-col flex-grow items-center justify-start flex-1 overflow-y-auto",
						droppable.isOver && "ring-4 ring-primary/20 ring-inset"
					)}
				>
					{droppable.isOver && (
						<div className="flex flex-col w-full gap-2 p-4">
							<div className="bg-primary/20 h-32 rounded-md"></div>
						</div>
					)}
					{!droppable.isOver && elements.length === 0 && (
						<p className="text-3xl text-muted-foreground flex flex-grow items-center font-bold">
							Drop here
						</p>
					)}

					{elements.length > 0 && (
						<div className="p-4 w-full gap-2 flex flex-col text-background">
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
	const DesignerElement = FormElements[element.type].designerComponent;

	return <DesignerElement />;
}

"use client";

import { cn } from "@/lib/utils";
import React from "react";
import DesignerSidebar from "./desginer-sidebar";
import { useDroppable } from "@dnd-kit/core";

const Designer = () => {
	const droppable = useDroppable({
		id: "designer-drop-area",
		data: {
			isDesignerDropArea: true,
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
					{!droppable.isOver && (
						<p className="text-3xl text-muted-foreground flex flex-grow items-center font-bold">
							Drop here
						</p>
					)}
				</div>
			</div>

			<DesignerSidebar />
		</div>
	);
};

export default Designer;

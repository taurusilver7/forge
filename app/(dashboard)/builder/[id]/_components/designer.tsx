"use client";

import { cn } from "@/lib/utils";
import React from "react";
import DesignerSidebar from "./desginer-sidebar";
import { useDroppable } from "@dnd-kit/core";

const Designer = () => {
	const droppable = {
		id: "designer-drop-area",
		data: {
			isDesignerDropArea: true,
		},
	};
	return (
		<div className="h-full w-full flex">
			<div className="p-4 w-full">
				<div
					className={cn(
						"bg-background max-w-4xl h-full rounded-xl flex flex-col flex-grow items-center justify-start flex-1 overflow-y-auto"
					)}
				>
					<p className="text-3xl text-muted-foreground flex flex-grow items-center font-bold">
						Drop here
					</p>
				</div>
			</div>

			<DesignerSidebar />
		</div>
	);
};

export default Designer;

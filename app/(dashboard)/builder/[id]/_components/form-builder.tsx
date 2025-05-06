"use client";
import React from "react";
import { Form } from "@prisma/client";
import SaveBtn from "./save";
import Publish from "./publish";
import Preview from "./preview";
import Designer from "./designer";
import { DndContext } from "@dnd-kit/core";
import DragOverlayWrapper from "./drag-overlay";

const FormBuilder = ({ form }: { form: Form }) => {
	return (
		<DndContext>
			<main className="flex flex-col w-full">
				<nav className="flex justify-between border-b-2 p-4 gap-3 items-center relative">
					<h2 className="truncate font-medium">
						<span className="text-muted-foreground mr-2">Form:</span>
						{form.name}
					</h2>

					<div className="flex items-center gap-2">
						<Preview />

						{!form.published && (
							<>
								<SaveBtn />
								<Publish />
							</>
						)}
					</div>
				</nav>

				<div className="relative overflow-y-auto h-auto flex-grow w-full items-center justify-center bg-accent bg-[url(/paper.svg)] dark:bg-[url(/paper-dark.svg)]">
					{/* Form Editor */}
					<Designer />
				</div>
			</main>
			<DragOverlayWrapper />
		</DndContext>
	);
};

export default FormBuilder;

"use client";
import React from "react";
import { Form } from "@prisma/client";
import SaveBtn from "./save";
import Publish from "./publish";
import Preview from "./preview";
import Designer from "./designer";
import { DndContext } from "@dnd-kit/core";
import DragOverlayWrapper from "./drag-overlay";
import { DoubleArrowUpIcon, PinTopIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

const FormBuilder = ({ form }: { form: Form }) => {
	return (
		<DndContext>
			<main className="flex flex-col w-full">
				<nav className="flex group/topbar justify-between border-b-2 p-4 gap-3 items-center relative">
					<div
						className={cn(
							"h-10 w-10 text-muted-foreground bg-primary-foreground hover:bg-neutral-100 z-50 dark:hover:bg-neutral-700 absolute top-16 right-1/4 opacity-100 group-hover/topbar:opacity-100 transition rounded-full"
						)}
						role="button"
					>
						<DoubleArrowUpIcon className="w-6 h-6 ml-2 mt-1" />
					</div>
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

				<div className="relative overflow-y-auto h-52 flex-grow flex w-full items-center justify-center bg-accent bg-[url(/paper.svg)] dark:bg-[url(/paper-dark.svg)]">
					{/* Form Editor */}
					<Designer />
				</div>
			</main>
			<DragOverlayWrapper />
		</DndContext>
	);
};

export default FormBuilder;

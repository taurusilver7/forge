/**
 * FormBuilder Component
 * 
 * PURPOSE:
 * Top-level wrapper for the form building interface.
 * Orchestrates the main builder layout with header navigation and editor canvas.
 * Provides DnD context for all child components to enable drag-and-drop functionality.
 * 
 * FEATURES:
 * - Displays form name and metadata in navigation header
 * - Conditionally shows Save and Publish buttons (only for unpublished forms)
 * - Provides Preview button for testing the form
 * - Sets up DnD system context for designer and sidebar
 * - Background styling with paper texture for visual feedback
 * 
 * FLOW:
 * 1. Receives form data as prop from parent (BuilderPage)
 * 2. Wraps entire builder in DndContext to enable drag-and-drop
 * 3. Renders navigation bar with form name and action buttons
 * 4. Renders Designer canvas in main content area
 * 5. Renders DragOverlayWrapper to show visual feedback during drag operations
 * 
 * CHILD COMPONENTS:
 * - SaveBtn: Persists form changes to database
 * - Publish: Makes form publicly accessible
 * - Preview: Opens modal to test form interaction
 * - Designer: Main canvas for element arrangement
 * - DragOverlayWrapper: Visual representation of dragged items
 * 
 * ERROR HANDLING:
 * - Relies on parent page validation (form existence check)
 * - DnD errors handled by underlying dnd-kit library
 */

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

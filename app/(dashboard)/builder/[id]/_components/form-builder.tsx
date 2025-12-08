"use client";
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

import React, { useEffect, useState } from "react";
import { Form } from "@prisma/client";
import SaveBtn from "./save";
import Publish from "./publish";
import Preview from "./preview";
import Designer from "./designer";
import {
	DndContext,
	useSensors,
	MouseSensor,
	TouchSensor,
	useSensor,
} from "@dnd-kit/core";
import DragOverlayWrapper from "./drag-overlay";
import useDesigner from "@/hooks/useDesigner";
import { ImSpinner2 } from "react-icons/im";

const FormBuilder = ({ form }: { form: Form }) => {
	const { setElements } = useDesigner();
	const [isReady, setIsReady] = useState<boolean>(false);

	// sensors for dnd-kit (drag-drop) to monitor I/O events (mouse-clicks)
	const mouseSensor = useSensor(MouseSensor, {
		activationConstraint: {
			distance: 10, // 10px
		},
	});
	const touchSensor = useSensor(TouchSensor, {
		activationConstraint: {
			delay: 300,
			tolerance: 5,
		},
	});
	const sensors = useSensors(mouseSensor, touchSensor);

	// persistant state for loading the saved form elements in the design context
	useEffect(() => {
		if (isReady) return;
		const elements = JSON.parse(form.content);
		setElements(elements);
		const readyTimeout = setTimeout(() => setIsReady(true), 500);

		return () => clearTimeout(readyTimeout);
	}, [form, setElements]);

	// render delay spinner
	if (!isReady) {
		return (
			<div className="flex items-center justify-center w-full h-full">
				<ImSpinner2 className="animate-spin h-12 w-12" />
			</div>
		);
	}

	return (
		<DndContext sensors={sensors}>
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
								<SaveBtn id={form.id} />
								<Publish id={form.id} />
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

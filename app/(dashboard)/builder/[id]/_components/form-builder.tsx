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
import Link from "next/link";
import { Form } from "@prisma/client";
import SaveBtn from "./save";
import Publish from "./publish";
import Preview from "./preview";
import Designer from "./designer";
import Confetti from "react-confetti";
import {
	DndContext,
	useSensors,
	MouseSensor,
	TouchSensor,
	useSensor,
} from "@dnd-kit/core";
import DragOverlayWrapper from "./drag-overlay";
import useDesigner from "@/hooks/useDesigner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	ChevronUpIcon,
	ChevronDownIcon,
} from "@radix-ui/react-icons";
import { ImSpinner2 } from "react-icons/im";

const FormBuilder = ({ form }: { form: Form }) => {
	const { setElements, setSelectedElement } = useDesigner();
	const [isReady, setIsReady] = useState<boolean>(false);
	const [isNavMinimized, setIsNavMinimized] = useState<boolean>(false);

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
		setSelectedElement(null);
		const readyTimeout = setTimeout(() => setIsReady(true), 500);

		return () => clearTimeout(readyTimeout);
	}, [form, setElements, setSelectedElement]);

	// render delay spinner
	if (!isReady) {
		return (
			<div className="flex items-center justify-center w-full h-full">
				<ImSpinner2 className="animate-spin h-12 w-12" />
			</div>
		);
	}

	const shareUrl = `${window.location.origin}/submit/${form.shareURL}`;
	const copyLink = () => {
		navigator.clipboard.writeText(shareUrl);
		toast({
			title: "URL Copied 📋",
			description: "URL copied to clipboard!",
		});
	};

	// Form Builder UI for a published form
	if (form.published) {
		return (
			<>
				<Confetti
					width={window.innerWidth}
					height={window.innerHeight}
					recycle={false}
					numberOfPieces={1000}
				/>
				<div className="flex flex-col items-center justify-center h-full w-full">
					<div className="max-w-lg">
						<h1 className="text-center text-4xl font-bold text-primary mb-10 pb-10 border-b">
							🚀🚀Form Published🚀🚀
						</h1>
						<h2 className="text-2xl">Share the form</h2>
						<h3 className="text-xl text-muted-foreground border-b pb-10">
							The link allows anyone to view and submit form.
						</h3>

						<div className="my-4 flex flex-col items-center w-full border-b pb-4">
							<Input className="w-full" readOnly value={shareUrl} />
							<Button className="mt-2 w-full" onClick={copyLink}>
								Copy Link
							</Button>
						</div>
						<div className="flex justify-between">
							<Button variant="link" asChild>
								<Link href={"/"} className="gap-2">
									<ArrowLeftIcon className="h-6 w-6" />
									Go Home
								</Link>
							</Button>
							<Button variant="link" asChild>
								<Link href={`/form/${form.id}`} className="gap-2">
									Form Details
									<ArrowRightIcon className="h-6 w-6" />
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<DndContext sensors={sensors}>
			<main className="flex flex-col w-full">
				{!isNavMinimized && (
					<nav className="flex justify-between border-b-2 p-4 gap-3 items-center relative">
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsNavMinimized(!isNavMinimized)}
								className="p-1"
							>
								<ChevronUpIcon className="h-4 w-4" />
							</Button>
							<h2 className="truncate font-medium">
								<span className="text-muted-foreground mr-2">
									Form:
								</span>
								{form.name}
							</h2>
						</div>

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
				)}

				{isNavMinimized && (
					<div className="fixed top-16 left-4 z-50">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsNavMinimized(false)}
							className="p-2"
						>
							<ChevronDownIcon className="h-4 w-4" />
						</Button>
					</div>
				)}

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

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

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Form } from "@prisma/client";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { UpdateFormContent } from "@/actions/form";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	ChevronUpIcon,
	ChevronDownIcon,
} from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";
import { getUniquePages } from "@/lib/pages";
import { idGenerator } from "@/lib/id-generator";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

const FormBuilder = ({ form }: { form: Form }) => {
	const { elements, setElements, setSelectedElement, undo, redo } =
		useDesigner();
	const [isReady, setIsReady] = useState<boolean>(false);
	const [isNavMinimized, setIsNavMinimized] = useState<boolean>(false);
	const [lastSaved, setLastSaved] = useState<Date>(new Date());
	const [currentPage, setCurrentPage] = useState("page_0");
	const [manualPages, setManualPages] = useState<Set<string>>(new Set());
	const displayedPages = useMemo(() => {
		const set = new Set(getUniquePages(elements));
		manualPages.forEach((p) => set.add(p));
		return Array.from(set);
	}, [elements, manualPages]);

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
		setIsReady(true);
	}, [form, setElements, setSelectedElement, isReady]);

	useEffect(() => {
		if (!isReady) return;
		const timer = setTimeout(async () => {
			const jsonElements = JSON.stringify(elements);
			try {
				await UpdateFormContent(form.id, jsonElements);
				setLastSaved(new Date());
			} catch {
				toast({ title: "Auto-save failed", variant: "destructive" });
			}
		}, 5000);
		return () => clearTimeout(timer);
	}, [elements, isReady, form.id]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "z") {
				e.preventDefault();
				if (e.shiftKey) redo();
				else undo();
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [undo, redo]);

	// render delay spinner
	if (!isReady) {
		return (
			<div className="flex items-center justify-center w-full h-full">
				<Loader2 className="animate-spin h-12 w-12" />
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
			<div className="w-full">
				<div className="fixed inset-0 pointer-events-none overflow-hidden">
					<Confetti
						width={window.innerWidth}
						height={window.innerHeight}
						recycle={false}
						numberOfPieces={1000}
					/>
				</div>
				<div className="flex flex-col min-h-full items-center justify-center px-4">
					<div className="max-w-lg w-full">
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
			</div>
		);
	}

	return (
		<DndContext sensors={sensors}>
			<main className="flex flex-col w-full h-screen min-h-0 overflow-hidden">
				{!isNavMinimized && (
					<nav className="shrink-0 flex flex-col md:flex-row justify-between border-b-2 p-4 gap-3 items-start md:items-center relative">
						<div className="flex items-center gap-2 order-2 md:order-1 w-full md:w-auto">
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
							<span className="text-xs text-muted-foreground ml-2">
								Saved
							</span>
						</div>

						<div className="flex justify-between items-center gap-2 order-1 md:order-2 w-full md:w-auto">
							<Preview />

							{!form.published && (
								<>
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

				{/* Display pages tabs */}
				<div className="flex items-center gap-1 px-4 py-1 border-b bg-muted/30 overflow-x-auto shrink-0">
					{displayedPages.map((pageId, i) => {
						const hasElements = getUniquePages(elements).includes(pageId);
						return (
							<div key={pageId} className="flex items-center gap-0.5">
								<Button
									variant={
										currentPage === pageId ? "default" : "ghost"
									}
									size="sm"
									onClick={() => setCurrentPage(pageId)}
									className="whitespace-nowrap"
								>
									Page {i + 1}
								</Button>
								{displayedPages.length > 1 && (
									<Button
										variant="ghost"
										size="sm"
										className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
										onClick={() => {
											if (hasElements) {
												const idx = displayedPages.indexOf(pageId);
												const targetPage =
													idx > 0
														? displayedPages[idx - 1]
														: displayedPages[1];
												setElements((prev) =>
													prev.map((el) => {
														if (
															(el.extraAttributes as any)
																?.pageId === pageId
														) {
															return {
																...el,
																extraAttributes: {
																	...el.extraAttributes,
																	pageId: targetPage,
																},
															};
														}
														return el;
													}),
												);
												setCurrentPage(targetPage);
											} else {
												setManualPages((prev) => {
													const next = new Set(prev);
													next.delete(pageId);
													return next;
												});
												const nextPage =
													displayedPages.find(
														(p) => p !== pageId,
													) || "page_0";
												setCurrentPage(nextPage);
											}
										}}
									>
										X
									</Button>
								)}
							</div>
						);
					})}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const newId = idGenerator();
							setManualPages((prev) => new Set([...prev, newId]));
							setCurrentPage(newId);
						}}
					>
						+ Add Page
					</Button>
				</div>

				<div className="relative flex-1 min-h-0  overflow-hidden w-full items-center justify-center bg-accent bg-[url(/paper.svg)] dark:bg-[url(/paper-dark.svg)]">
					{/* Form Editor */}
					<Designer currentPage={currentPage} />
				</div>
			</main>
			<DragOverlayWrapper />
		</DndContext>
	);
};

export default FormBuilder;

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Form } from "@prisma/client";
import Publish from "./publish";
import Preview from "./preview";
import Designer from "./designer";
import PageSidebar from "./page-sidebar";
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
import { UpdateForm } from "@/actions/form";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	ChevronUpIcon,
	ChevronDownIcon,
} from "@radix-ui/react-icons";
import { Loader2, Save } from "lucide-react";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

const FormBuilder = ({ form }: { form: Form }) => {
	const { elements, setElements, setSelectedElement, undo, redo, pages, setPages, currentPage, setCurrentPage } =
		useDesigner();
	const [isReady, setIsReady] = useState<boolean>(false);
	const [isNavMinimized, setIsNavMinimized] = useState<boolean>(false);
	const [lastSaved, setLastSaved] = useState<Date>(new Date());
	const [saving, setSaving] = useState(false);

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
		if (form.pages) {
			setPages(JSON.parse(form.pages));
			const parsed = JSON.parse(form.pages);
			setCurrentPage(parsed[0]?.id || "page_0");
		}
		setIsReady(true);
	}, [form, setElements, setSelectedElement, setPages, setCurrentPage, isReady]);

	const handleSave = async () => {
		setSaving(true);
		try {
			await UpdateForm(form.id, JSON.stringify(elements), JSON.stringify(pages));
			setLastSaved(new Date());
			toast({ title: "Saved", description: "Form saved successfully." });
		} catch {
			toast({ title: "Save failed", variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "z") {
				e.preventDefault();
				if (e.shiftKey) redo();
				else undo();
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [undo, redo, handleSave]);

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
									<Button variant="secondary" size="sm" onClick={handleSave} disabled={saving}>
										<Save className="h-4 w-4 mr-1" />
										{saving ? "Saving..." : "Save"}
									</Button>
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

				<div className="flex flex-1 min-h-0 overflow-hidden">
					<PageSidebar />
					<div className="relative flex-1 min-h-0 overflow-hidden items-center justify-center bg-accent bg-[url(/paper.svg)] dark:bg-[url(/paper-dark.svg)]">
						<Designer currentPage={currentPage} />
					</div>
				</div>
			</main>
			<DragOverlayWrapper />
		</DndContext>
	);
};

export default FormBuilder;

import { FormElements } from "@/components/form-elements";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import useDesigner from "@/hooks/useDesigner";
import { getUniquePages, getPageElements } from "@/lib/pages";
import { TableIcon } from "@radix-ui/react-icons";
import React, { useState } from "react";

const Preview = () => {
	const { elements } = useDesigner();
	const [pageIndex, setPageIndex] = useState(0);
	const pages = getUniquePages(elements);
	const currentPageElements = getPageElements(elements, pages[pageIndex]);
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="gap-2">
					<TableIcon className="w-4 h-4" />
					Preview
				</Button>
			</DialogTrigger>
			<DialogContent className="w-screen h-screen max-h-screen max-w-full flex flex-col flex-grow p-0 gap-0">
				<div className="px-4 py-2 border-b">
					<DialogTitle className="text-lg font-bold text-muted-foreground">
						Form preview
					</DialogTitle>
					<DialogDescription className="text-muted-foreground text-sm">
						This is how the form looks like.
					</DialogDescription>
				</div>
				<div className="overflow-y-auto flex flex-col p-4 flex-grow items-center justify-center bg-accent bg-[url(/paper.svg)] dark:bg-[url(/paper-dark.svg)]">
					{/* form preview */}
					<div className="flex flex-col flex-grow max-w-2xl mx-auto gap-4 bg-background h-full w-full rounded-2xl overflow-y-auto p-8">
						{pages.length > 1 && (
							<div className="w-full bg-secondary h-2 rounded-full">
								<div
									className="bg-primary h-2 rounded-full transition-all"
									style={{ width: `${((pageIndex + 1) / pages.length) * 100}%` }}
								/>
							</div>
						)}
						{currentPageElements.map((element) => {
							const FormComponent =
								FormElements[element.type].formComponent;
							return (
								<FormComponent
									key={element.id}
									elementInstance={element}
								/>
							);
						})}
						{pages.length > 1 && (
							<div className="flex justify-between mt-8">
								{pageIndex > 0 && (
									<Button variant="outline" onClick={() => setPageIndex(i => i - 1)}>
										Back
									</Button>
								)}
								<div className="flex-1" />
								{pageIndex < pages.length - 1 && (
									<Button onClick={() => setPageIndex(i => i + 1)}>
										Next
									</Button>
								)}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Preview;

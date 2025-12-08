import { FormElements } from "@/components/form-elements";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import useDesigner from "@/hooks/useDesigner";
import { TableIcon } from "@radix-ui/react-icons";
import React from "react";

const Preview = () => {
	const { elements } = useDesigner();
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
					<p className="text-lg font-bold text-muted-foreground">
						Form preview
					</p>
					<p className="text-sm text-muted-foreground">
						This is how the form looks like.
					</p>
				</div>
				<div className="overflow-y-auto flex flex-col p-4 flex-grow items-center justify-center bg-accent bg-[url(/paper.svg)] dark:bg-[url(/paper-dark.svg)]">
					{/* form preview */}
					<div className="flex flex-col flex-grow max-w-2xl mx-auto gap-4 bg-background h-full w-full rounded-2xl overflow-y-auto p-8">
						{elements.map((element) => {
							const FormComponent =
								FormElements[element.type].formComponent;
							return (
								<FormComponent
									key={element.id}
									elementInstance={element}
								/>
							);
						})}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Preview;

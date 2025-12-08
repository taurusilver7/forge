import useDesigner from "@/hooks/useDesigner";
import React from "react";
import { FormElements } from "./form-elements";
import { Button } from "./ui/button";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Separator } from "./ui/separator";

const PropertyFormSidebar = () => {
	const { selectedElement, setSelectedElement } = useDesigner();

	if (!selectedElement) return null;

	const PropertiesForm =
		FormElements[selectedElement?.type].propertiesComponent;
	return (
		<div className="flex flex-col p-2">
			<div className="flex justify-between items-center">
				<p className="text-sm text-foreground/70">Element Properties</p>
				<Button
					size={"icon"}
					variant={"ghost"}
					onClick={() => {
						setSelectedElement(null);
					}}
				>
					<Cross1Icon className="h-4 w-4" />
				</Button>
			</div>
			<Separator className="mb-4" />
			<PropertiesForm elementInstance={selectedElement} />
		</div>
	);
};

export default PropertyFormSidebar;

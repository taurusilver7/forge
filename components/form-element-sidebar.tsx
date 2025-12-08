import React from "react";
import SidebarElement from "./sidebar-element";
import { FormElements } from "./form-elements";
import { Separator } from "./ui/separator";

const FormElementSidebar = () => {
	return (
		<div>
			<p className="text-sm text-foreground/20">Drag & Drop Elements</p>
			<Separator className="my-2" />
			<div className="grid grid-cols-1 md:grid-cols-2 gap-2 place-items-center">
				<p className="text-sm text-muted-foreground col-span-1 md:col-span-2 my-2 place-self-start">
					Layout Elements
				</p>
				<SidebarElement formElement={FormElements.TextField} />

				<p className="text-sm text-muted-foreground col-span-1 md:col-span-2 my-2 place-self-start">
					Form Elements
				</p>
				<SidebarElement formElement={FormElements.TextField} />
			</div>
		</div>
	);
};

export default FormElementSidebar;

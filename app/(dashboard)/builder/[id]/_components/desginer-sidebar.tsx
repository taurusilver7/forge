import { FormElements } from "@/components/form-elements";
import SidebarElement from "@/components/sidebar-element";
import React from "react";

const DesignerSidebar = () => {
	return (
		<aside className="w-96 max-w-[400px] h-full m-auto rounded-xl flex flex-col flex-grow border-l-2 border-muted p-4 bg-background overflow-y-auto">
			Elements
			<SidebarElement formElement={FormElements.TextField} />
		</aside>
	);
};

export default DesignerSidebar;

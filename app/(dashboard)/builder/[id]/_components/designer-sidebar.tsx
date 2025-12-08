/**
 * A Custom Sidebar that displays either Form Elements or Form Properties based on the selectedElement.
 *
 *
 */

import FormElementSidebar from "@/components/form-element-sidebar";
import PropertyFormSidebar from "@/components/property-sidebar";

import useDesigner from "@/hooks/useDesigner";
import React from "react";

const DesignerSidebar = () => {
	const { selectedElement } = useDesigner();
	return (
		<aside className="w-96 max-w-96 h-full m-auto rounded-xl flex flex-col flex-grow border-l-2 border-muted p-4 bg-background overflow-y-auto">
			{!selectedElement && <FormElementSidebar />}
			{selectedElement && <PropertyFormSidebar />}
		</aside>
	);
};

export default DesignerSidebar;

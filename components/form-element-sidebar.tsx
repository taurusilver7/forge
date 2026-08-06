import React from "react";
import SidebarElement from "./sidebar-element";
import { FormElements } from "./form-elements";
import { Separator } from "./ui/separator";

const FormElementSidebar = () => {
	return (
		<div className="">
			<p className="text-sm text-foreground/20">Drag & Drop Elements</p>
			<Separator className="my-2" />
			<div className="flex flex-col gap-1">
				<p className="text-sm text-muted-foreground my-2">
					Layout Elements
				</p>
				<SidebarElement formElement={FormElements.TitleField} />
				<SidebarElement formElement={FormElements.SubTitleField} />
				<SidebarElement formElement={FormElements.ParagraphField} />
				<SidebarElement formElement={FormElements.SeparatorField} />
				<SidebarElement formElement={FormElements.SpacerField} />

				<p className="text-sm text-muted-foreground my-2">
					Form Elements
				</p>
				<SidebarElement formElement={FormElements.TextField} />
				<SidebarElement formElement={FormElements.NumberField} />
				<SidebarElement formElement={FormElements.TextAreaField} />
				<SidebarElement formElement={FormElements.DateField} />
				<SidebarElement formElement={FormElements.CheckboxField} />
				<SidebarElement formElement={FormElements.SelectField} />
				<SidebarElement formElement={FormElements.EmailField} />
				<SidebarElement formElement={FormElements.PhoneField} />
				<SidebarElement formElement={FormElements.RatingField} />
				<SidebarElement formElement={FormElements.SliderField} />
				<SidebarElement formElement={FormElements.ChoiceField} />
			</div>
		</div>
	);
};

export default FormElementSidebar;

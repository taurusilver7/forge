"use client";

import { createContext, useState, Dispatch, SetStateAction } from "react";
import { FormElementInstance } from "../form-elements";

type DesignerContextType = {
	elements: FormElementInstance[];
	setElements: Dispatch<SetStateAction<FormElementInstance[]>>;
	addElement: (index: number, element: FormElementInstance) => void;
	removeElement: (id: string) => void;

	selectedElement: FormElementInstance | null;
	setSelectedElement: Dispatch<SetStateAction<FormElementInstance | null>>;

	updateElement: (id: string, element: FormElementInstance) => void;
};

export const DesignerContext = createContext<DesignerContextType | null>(null);

export default function DesignerContextProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [elements, setElements] = useState<FormElementInstance[]>([]);
	const [selectedElement, setSelectedElement] =
		useState<FormElementInstance | null>(null);

	const addElement = (index: number, element: FormElementInstance) => {
		setElements((prev) => {
			const newElements = [...prev];
			newElements.splice(index, 0, element);
			return newElements;
		});
	};

	const removeElement = (id: string) => {
		// console.log("Removing element", id);
		setElements(
			(prev) => prev.filter((element) => element.id !== id)

			/*
			Alternate method to filter out tte selected element to remove.
				{
				const newElements = [...prev];
				const index = newElements.findIndex((e) => e.id === id);

				if (index !== -1) {
					newElements.splice(index, 1);
				}

				return newElements;
			}
			*/
		);
	};

	const updateElement = (id: string, element: FormElementInstance) => {
		setElements((prev) => {
			const newElements = [...prev];
			const index = newElements.findIndex((el) => el.id === id);
			newElements[index] = element;
			return newElements;
		});
	};

	return (
		<DesignerContext.Provider
			value={{
				elements,
				addElement,
				removeElement,
				setElements,

				selectedElement,
				setSelectedElement,
				updateElement,
			}}
		>
			{children}
		</DesignerContext.Provider>
	);
}

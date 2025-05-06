"use client";

import { createContext, useState } from "react";
import { FormElementInstance } from "../form-elements";

type DesignerContextType = {
	elements: FormElementInstance[];
	removeElement: (id: string) => void;
	addElement: (index: number, element: FormElementInstance) => void;
};

export const DesignerContext = createContext<DesignerContextType | null>(null);

export default function DesignerContextProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [elements, setElements] = useState<FormElementInstance[]>([]);

	const addElement = (index: number, element: FormElementInstance) => {
		setElements((prev) => {
			const newElements = [...prev];
			newElements.splice(index, 0, element);
			return newElements;
		});
	};

	const removeElement = (id: string) => {
		console.log("Removing element", id);
		setElements((prev) => {
			const newElements = [...prev];
			const index = newElements.findIndex((e) => e.id === id);

			if (index !== -1) {
				newElements.splice(index, 1);
			}

			return newElements;
		});
	};
	return (
		<DesignerContext.Provider value={{ elements, addElement, removeElement }}>
			{children}
		</DesignerContext.Provider>
	);
}

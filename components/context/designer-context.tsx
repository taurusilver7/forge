"use client";
/**
 * DesignerContext Component
 *
 * PURPOSE:
 * Provides a centralized state management system for the form builder's designer.
 * Manages all form elements, their manipulation, and the currently selected element.
 *
 * FEATURES:
 * - Add elements to the form at a specific index
 * - Remove elements by ID
 * - Update element properties
 * - Track the currently selected element for editing
 * - Maintain the ordered list of all form elements
 *
 * FLOW:
 * 1. FormBuilder wraps the Designer component with this context provider
 * 2. Child components (Designer, DesignerElementWrapper) consume the context via useDesigner hook
 * 3. When user adds/removes/modifies elements, context methods are called
 * 4. State updates trigger re-renders in all consuming components
 * 5. Selected element state is used to highlight and show properties panel
 *
 * STATE MANAGEMENT:
 * - elements: FormElementInstance[] - Array of all form fields/elements
 * - selectedElement: FormElementInstance | null - Currently selected element for editing
 *
 * ERROR HANDLING:
 * - useDesigner hook throws error if context is not available (ensures proper provider wrapping)
 * - updateElement safely finds element by ID before updating (prevents crashes on invalid IDs)
 */

import { createContext, useState, useCallback, Dispatch, SetStateAction } from "react";
import { FormElementInstance } from "../form-elements";

type DesignerContextType = {
	elements: FormElementInstance[];
	setElements: Dispatch<SetStateAction<FormElementInstance[]>>;
	addElement: (index: number, element: FormElementInstance) => void;
	removeElement: (id: string) => void;

	selectedElement: FormElementInstance | null;
	setSelectedElement: Dispatch<SetStateAction<FormElementInstance | null>>;

	updateElement: (id: string, element: FormElementInstance) => void;
	undo: () => void;
	redo: () => void;
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
	const [history, setHistory] = useState<FormElementInstance[][]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	const pushHistory = useCallback((prevElements: FormElementInstance[]) => {
		setHistory((h) => [...h.slice(0, historyIndex + 1), prevElements]);
		setHistoryIndex((i) => i + 1);
	}, [historyIndex]);

	const addElement = useCallback((index: number, element: FormElementInstance) => {
		pushHistory(elements);
		setElements((prev) => {
			const newElements = [...prev];
			newElements.splice(index, 0, element);
			return newElements;
		});
	}, [elements, pushHistory]);

	const removeElement = useCallback((id: string) => {
		pushHistory(elements);
		setElements((prev) => prev.filter((element) => element.id !== id));
	}, [elements, pushHistory]);

	const updateElement = useCallback((id: string, element: FormElementInstance) => {
		pushHistory(elements);
		setElements((prev) => {
			const newElements = [...prev];
			const index = newElements.findIndex((el) => el.id === id);
			newElements[index] = element;
			return newElements;
		});
	}, [elements, pushHistory]);

	const undo = useCallback(() => {
		if (historyIndex < 0) return;
		setElements(history[historyIndex]);
		setHistoryIndex((i) => i - 1);
	}, [history, historyIndex]);

	const redo = useCallback(() => {
		if (historyIndex >= history.length - 1) return;
		setHistoryIndex((i) => i + 1);
		setElements(history[historyIndex + 1]);
	}, [history, historyIndex]);

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
				undo,
				redo,
			}}
		>
			{children}
		</DesignerContext.Provider>
	);
}

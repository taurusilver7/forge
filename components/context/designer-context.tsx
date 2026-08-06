"use client";

import { createContext, useState, useCallback, Dispatch, SetStateAction } from "react";
import { FormElementInstance } from "../form-elements";
import { idGenerator } from "@/lib/id-generator";

export type Page = { id: string; label: string };

type DesignerContextType = {
  elements: FormElementInstance[];
  setElements: Dispatch<SetStateAction<FormElementInstance[]>>;
  addElement: (index: number, element: FormElementInstance) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;

  selectedElement: FormElementInstance | null;
  setSelectedElement: Dispatch<SetStateAction<FormElementInstance | null>>;

  updateElement: (id: string, element: FormElementInstance) => void;
  undo: () => void;
  redo: () => void;

  pages: Page[];
  setPages: Dispatch<SetStateAction<Page[]>>;
  currentPage: string;
  setCurrentPage: Dispatch<SetStateAction<string>>;
};

export const DesignerContext = createContext<DesignerContextType | null>(null);

const HISTORY_LIMIT = 100;

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
  const [pages, setPages] = useState<Page[]>([{ id: "page_0", label: "Page 1" }]);
  const [currentPage, setCurrentPage] = useState("page_0");

  const pushHistory = useCallback((prevElements: FormElementInstance[]) => {
    setHistory((h) => {
      const next = [...h.slice(0, historyIndex + 1), prevElements];
      return next.length > HISTORY_LIMIT
        ? next.slice(next.length - HISTORY_LIMIT)
        : next;
    });
    setHistoryIndex((i) => (i + 1 > HISTORY_LIMIT - 1 ? HISTORY_LIMIT - 1 : i + 1));
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

  const duplicateElement = useCallback(
    (id: string) => {
      pushHistory(elements);
      setElements((prev) => {
        const index = prev.findIndex((el) => el.id === id);
        if (index === -1) return prev;
        const copy = { ...prev[index], id: idGenerator() };
        const next = [...prev];
        next.splice(index + 1, 0, copy);
        return next;
      });
    },
    [elements, pushHistory],
  );

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
        duplicateElement,
        setElements,

        selectedElement,
        setSelectedElement,
        updateElement,
        undo,
        redo,

        pages,
        setPages,
        currentPage,
        setCurrentPage,
      }}
    >
      {children}
    </DesignerContext.Provider>
  );
}

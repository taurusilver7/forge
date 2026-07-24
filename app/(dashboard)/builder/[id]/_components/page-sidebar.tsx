"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useDesigner from "@/hooks/useDesigner";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { idGenerator } from "@/lib/id-generator";

export default function PageSidebar() {
  const { pages, setPages, currentPage, setCurrentPage, elements, setElements } = useDesigner();

  const addPage = () => {
    const id = idGenerator();
    const label = `Page ${pages.length + 1}`;
    setPages((prev) => [...prev, { id, label }]);
    setCurrentPage(id);
  };

  const deletePage = (pageId: string) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    setElements((prev) => prev.filter((e) => ((e.extraAttributes as any)?.pageId ?? "page_0") !== pageId));
    if (currentPage === pageId) {
      const idx = pages.findIndex((p) => p.id === pageId);
      const next = idx > 0 ? pages[idx - 1].id : pages[1].id;
      setCurrentPage(next);
    }
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    setPages((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  if (pages.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 w-auto min-w-32 max-w-[200px] border-r bg-muted/20 p-2 overflow-y-auto shrink-0">
      {pages.map((page, i) => (
        <div
          key={page.id}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm group hover:bg-accent",
            currentPage === page.id && "bg-accent font-medium"
          )}
          onClick={() => setCurrentPage(page.id)}
        >
          <span className="flex-1 truncate">{page.label}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {i > 0 && (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); movePage(i, -1); }}>
                <ChevronUp className="h-3 w-3" />
              </Button>
            )}
            {i < pages.length - 1 && (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); movePage(i, 1); }}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            )}
            {pages.length > 1 && (
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="mt-1 gap-1 text-xs" onClick={addPage}>
        <Plus className="h-3 w-3" /> Add Page
      </Button>
    </div>
  );
}
// ponytail: arrow buttons for reorder instead of dnd; upgrade to @dnd-kit/sortable if pages exceed 10

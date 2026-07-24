"use client";

import { FormElements } from "@/components/form-elements";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useDesigner from "@/hooks/useDesigner";
import { getPageElements } from "@/lib/pages";
import { Monitor, Smartphone, TableIcon } from "lucide-react";
import React, { useState } from "react";

type ViewMode = "desktop" | "mobile";

const Preview = () => {
  const { elements, pages } = useDesigner();
  const [pageIndex, setPageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const currentPageElements = getPageElements(elements, pages[pageIndex]?.id || "page_0");

  const formContent = (
    <>
      {pages.length > 1 && (
        <div className="w-full bg-secondary h-2 rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((pageIndex + 1) / pages.length) * 100}%` }}
          />
        </div>
      )}
      {currentPageElements.map((element) => {
        const FormComponent = FormElements[element.type].formComponent;
        return <FormComponent key={element.id} elementInstance={element} />;
      })}
      {pages.length > 1 && (
        <div className="flex justify-between mt-8">
          {pageIndex > 0 && (
            <Button variant="outline" onClick={() => setPageIndex((i) => i - 1)}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {pageIndex < pages.length - 1 && (
            <Button onClick={() => setPageIndex((i) => i + 1)}>Next</Button>
          )}
        </div>
      )}
    </>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <TableIcon className="w-4 h-4" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-h-screen max-w-full flex flex-col flex-grow p-0 gap-0">
        <div className="flex items-center px-4 py-2 border-b shrink-0">
          <div className="flex-1">
            <DialogTitle className="text-lg font-bold text-muted-foreground">
              Form preview
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              This is how the form looks like.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "desktop" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex items-start justify-center p-4 bg-muted">
          {viewMode === "desktop" ? (
            <div className="flex flex-col w-full max-w-2xl mx-auto gap-4 bg-background shadow-sm rounded-xl p-8 my-4">
              {formContent}
            </div>
          ) : (
            <div className="w-[375px] max-w-full mx-auto bg-background rounded-[2rem] border-[3px] border-foreground/20 shadow-xl overflow-hidden my-4">
              <div className="h-6 bg-muted rounded-t-[calc(2rem-3px)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-foreground/20" />
              </div>
              <div className="p-4 max-h-[650px] overflow-y-auto flex flex-col gap-4">
                {formContent}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Preview;
// ponytail: view toggle via state + CSS frames; no separate mobile/desktop components

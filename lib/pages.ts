import { FormElementInstance } from "@/components/form-elements";

export const DEFAULT_PAGES = [{ id: "page_0", label: "Page 1" }];

export function getUniquePages(elements: FormElementInstance[]): string[] {
  const pages = new Set(
    elements.map(
      (e) => (e.extraAttributes as any)?.pageId || "page_0"
    )
  );
  if (pages.size === 0) pages.add("page_0");
  return Array.from(pages).sort();
}

export function getPageElements(
  elements: FormElementInstance[],
  pageId: string
): FormElementInstance[] {
  return elements.filter(
    (e) => ((e.extraAttributes as any)?.pageId ?? "page_0") === pageId
  );
}
// ponytail: getUniquePages kept for public form-submit; builder uses explicit pages array

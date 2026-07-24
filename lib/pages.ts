import { FormElementInstance } from "@/components/form-elements";

export const DEFAULT_PAGES = [{ id: "page_0", label: "Page 1" }];

export function getPageElements(
  elements: FormElementInstance[],
  pageId: string
): FormElementInstance[] {
  return elements.filter(
    (e) => ((e.extraAttributes as any)?.pageId ?? "page_0") === pageId
  );
}
// ponytail: pages are an explicit ordered array, not derived from elements

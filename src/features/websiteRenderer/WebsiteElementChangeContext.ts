import { createContext, useContext } from "react";
import type { RichTextDocument, WebsiteElement } from "../websiteElements/types";

type WebsiteElementChangeContextValue = {
  onElementChange?: (sectionId: string, element: WebsiteElement) => void;
  onRichTextDocumentChange?: (sectionId: string, elementId: string, document: RichTextDocument) => void;
};
export const WebsiteElementChangeContext = createContext<WebsiteElementChangeContextValue>({});
export const useWebsiteElementChange = () => useContext(WebsiteElementChangeContext);

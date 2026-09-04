import { createContext, useContext } from "react";
import type { WebsiteElement } from "../websiteElements/types";

type WebsiteElementChange = (sectionId: string, element: WebsiteElement) => void;
export const WebsiteElementChangeContext = createContext<WebsiteElementChange | null>(null);
export const useWebsiteElementChange = () => useContext(WebsiteElementChangeContext);

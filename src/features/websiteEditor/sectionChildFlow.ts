import { z } from "zod";
import { createSemanticId } from "./createSemanticId";
import { websiteElementTreeSchema } from "../websiteElements/schemas";
import type { CompositionGroup, DividerElement, MediaElement, RichTextElement, TextElement, WebsiteElement } from "../websiteElements/types";
import { canonicalizeRichTextDocument } from "../websiteElements/richText";

export const SECTION_SPECIALIZED_REFERENCE = { kind: "specialized", key: "content" } as const;

const specializedReferenceSchema = z.object({
  kind: z.literal("specialized"),
  key: z.literal("content"),
}).strict();

const elementReferenceSchema = z.object({
  kind: z.literal("element"),
  id: z.string().min(1).max(255),
}).strict();

export const sectionChildReferenceSchema = z.discriminatedUnion("kind", [
  specializedReferenceSchema,
  elementReferenceSchema,
]);

export const sectionChildFlowSchema = z.object({
  elements: websiteElementTreeSchema.max(20),
  order: z.array(sectionChildReferenceSchema).max(21),
}).strict().superRefine((flow, context) => {
  const specialized = flow.order.filter(({ kind }) => kind === "specialized");
  if (specialized.length !== 1) context.addIssue({ code: "custom", path: ["order"], message: "Child flow must contain exactly one specialized content reference." });
  const ids = flow.elements.map(({ id }) => id);
  const references = flow.order.flatMap((reference) => reference.kind === "element" ? [reference.id] : []);
  if (new Set(references).size !== references.length) context.addIssue({ code: "custom", path: ["order"], message: "Child flow element references must be unique." });
  if (references.length !== ids.length || references.some((id) => !ids.includes(id)) || ids.some((id) => !references.includes(id))) {
    context.addIssue({ code: "custom", path: ["order"], message: "Child flow order must reference every element exactly once." });
  }
});

export const textSectionChildFlowSchema = sectionChildFlowSchema.superRefine((flow, context) => {
  flow.elements.forEach((element, index) => {
    if (element.type !== "text" && element.type !== "richText" && element.type !== "divider" && element.type !== "media" && element.type !== "compositionGroup") context.addIssue({ code: "custom", path: ["elements", index, "type"], message: `Element type ${element.type} is not allowed in this Section.` });
  });
});

export type SectionChildReference = z.infer<typeof sectionChildReferenceSchema>;
export type SectionChildFlow = z.infer<typeof sectionChildFlowSchema>;

export function resolveSectionChildOrder(flow?: SectionChildFlow): SectionChildReference[] {
  return flow ? flow.order : [SECTION_SPECIALIZED_REFERENCE];
}

export function createTextElement(): TextElement {
  return { id: createSemanticId("text"), type: "text", text: "" };
}

export function createRichTextElement(): RichTextElement {
  return { id: createSemanticId("rich-text"), type: "richText", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "" }] }] } };
}

export function createDividerElement(): DividerElement {
  return { id: createSemanticId("divider"), type: "divider" };
}

export function createMediaElement(mediaId?: string): MediaElement {
  return { id: createSemanticId("media"), type: "media", items: mediaId ? [{ id: createSemanticId("media-item"), type: "image", mediaId, alt: "Image" }] : [] };
}

export function createGroupElement(): CompositionGroup {
  return { id: createSemanticId("group"), type: "compositionGroup", children: [] };
}

export function insertSectionElement(flow: SectionChildFlow | undefined, element: WebsiteElement, after?: SectionChildReference): SectionChildFlow {
  const current: SectionChildFlow = flow ? structuredClone(flow) : { elements: [], order: [SECTION_SPECIALIZED_REFERENCE] };
  const index = after ? current.order.findIndex((reference) => sameReference(reference, after)) : current.order.length - 1;
  current.elements.push(element);
  current.order.splice(index >= 0 ? index + 1 : current.order.length, 0, { kind: "element", id: element.id });
  return current;
}

export function updateSectionElement(flow: SectionChildFlow, element: WebsiteElement): SectionChildFlow {
  return { ...flow, elements: flow.elements.map((current) => updateElementTree(current, element)) };
}

export function setSectionElementHidden(flow: SectionChildFlow, elementId: string, hidden: boolean): SectionChildFlow {
  const current = findSectionElement(flow, elementId);
  if (!current) return flow;
  const next = { ...current };
  if (hidden) next.isHidden = true;
  else delete next.isHidden;
  return updateSectionElement(flow, next);
}

export function canonicalizeSectionChildFlowRichText(flow: SectionChildFlow): SectionChildFlow {
  const canonicalize = (element: WebsiteElement): WebsiteElement => element.type === "richText"
    ? { ...element, document: canonicalizeRichTextDocument(element.document) }
    : element.type === "compositionGroup"
      ? { ...element, children: element.children.map(canonicalize) } as WebsiteElement
      : element;
  return { ...flow, elements: flow.elements.map(canonicalize) };
}

function updateElementTree(current: WebsiteElement, replacement: WebsiteElement): WebsiteElement {
  if (current.id === replacement.id) return replacement;
  if (current.type !== "compositionGroup") return current;
  return { ...current, children: current.children.map((child) => updateElementTree(child, replacement)) } as WebsiteElement;
}

export function findSectionElement(flow: SectionChildFlow | undefined, id: string): WebsiteElement | undefined {
  const visit = (element: WebsiteElement): WebsiteElement | undefined => element.id === id ? element : element.type === "compositionGroup" ? element.children.map(visit).find(Boolean) : undefined;
  return flow?.elements.map(visit).find(Boolean);
}

export function updateSectionTextElement(flow: SectionChildFlow, elementId: string, text: string): SectionChildFlow | null {
  const element = findSectionElement(flow, elementId);
  return element?.type === "text" ? updateSectionElement(flow, { ...element, text }) : null;
}

export function updateSectionRichTextAppearance(flow: SectionChildFlow, elementId: string, appearance: RichTextElement["appearance"]): SectionChildFlow | null {
  const current = findSectionElement(flow, elementId);
  if (current?.type !== "richText") return null;
  const next = { ...current };
  if (appearance === undefined) delete next.appearance;
  else next.appearance = appearance;
  return updateSectionElement(flow, next);
}

export function addGroupChild(flow: SectionChildFlow, groupId: string, child: WebsiteElement): SectionChildFlow {
  const group = findSectionElement(flow, groupId);
  return group?.type === "compositionGroup" ? updateSectionElement(flow, { ...group, children: [...group.children, child] } as WebsiteElement) : flow;
}

export function updateGroupChildren(flow: SectionChildFlow, groupId: string, children: WebsiteElement[]): SectionChildFlow {
  const group = findSectionElement(flow, groupId);
  return group?.type === "compositionGroup" ? updateSectionElement(flow, { ...group, children } as WebsiteElement) : flow;
}

export function ungroupSectionElement(flow: SectionChildFlow, groupId: string): SectionChildFlow {
  const group = flow.elements.find((element) => element.id === groupId);
  if (group?.type !== "compositionGroup") {
    const ungroupNested = (element: WebsiteElement): WebsiteElement => element.type !== "compositionGroup" ? element : { ...element, children: element.children.flatMap((child) => child.id === groupId && child.type === "compositionGroup" ? child.children : [ungroupNested(child)]) } as WebsiteElement;
    return { ...flow, elements: flow.elements.map(ungroupNested) };
  }
  const referenceIndex = flow.order.findIndex((reference) => reference.kind === "element" && reference.id === groupId);
  if (referenceIndex < 0) return flow;
  const order = [...flow.order];
  order.splice(referenceIndex, 1, ...group.children.map(({ id }) => ({ kind: "element" as const, id })));
  return { elements: flow.elements.flatMap((element) => element.id === groupId ? group.children : [element]), order };
}

export function deleteSectionElement(flow: SectionChildFlow, elementId: string): { flow?: SectionChildFlow; selection: SectionChildReference } {
  const index = flow.order.findIndex((reference) => reference.kind === "element" && reference.id === elementId);
  const order = flow.order.filter((reference) => !(reference.kind === "element" && reference.id === elementId));
  const elements = flow.elements.filter(({ id }) => id !== elementId);
  return { flow: elements.length ? { elements, order } : undefined, selection: order[Math.min(Math.max(index, 0), order.length - 1)] ?? SECTION_SPECIALIZED_REFERENCE };
}

export function duplicateSectionElement(flow: SectionChildFlow, elementId: string): { flow: SectionChildFlow; elementId: string } | null {
  const source = flow.elements.find(({ id }) => id === elementId);
  if (!source || flow.elements.length >= 20) return null;
  const duplicate = regenerateElementIds(structuredClone(source));
  return { flow: insertSectionElement(flow, duplicate, { kind: "element", id: elementId }), elementId: duplicate.id };
}

export function reorderSectionChild(flow: SectionChildFlow, active: SectionChildReference, over: SectionChildReference): SectionChildFlow {
  const order = [...flow.order];
  const from = order.findIndex((reference) => sameReference(reference, active));
  const to = order.findIndex((reference) => sameReference(reference, over));
  if (from < 0 || to < 0 || from === to) return flow;
  const [reference] = order.splice(from, 1);
  order.splice(to, 0, reference);
  return { ...flow, order };
}

export function moveSectionChild(flow: SectionChildFlow, reference: SectionChildReference, direction: -1 | 1): SectionChildFlow {
  const index = flow.order.findIndex((candidate) => sameReference(candidate, reference));
  const target = index + direction;
  return index < 0 || target < 0 || target >= flow.order.length ? flow : reorderSectionChild(flow, reference, flow.order[target]);
}

function sameReference(first: SectionChildReference, second: SectionChildReference) {
  return first.kind === second.kind && (first.kind === "specialized" ? second.kind === "specialized" : second.kind === "element" && first.id === second.id);
}

function regenerateElementIds(element: WebsiteElement): WebsiteElement {
  element.id = createSemanticId(element.type === "compositionGroup" ? "group" : element.type);
  if (element.type === "mediaCollection" || element.type === "media") element.items.forEach((item) => { item.id = createSemanticId("media-item"); });
  if (element.type === "compositionGroup") element.children.forEach((child) => regenerateElementIds(child));
  return element;
}

export function duplicateWebsiteElement<T extends { id: string; type: string }>(element: T): T {
  return regenerateElementIds(structuredClone(element) as WebsiteElement) as T;
}

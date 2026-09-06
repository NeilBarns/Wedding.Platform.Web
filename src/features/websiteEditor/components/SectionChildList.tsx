import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Eye, EyeOff, GripVertical, Plus, Trash2, Ungroup } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../../components/ui/IconButton";
import { richTextPlainText } from "../../websiteElements/richText";
import type { CompositionGroup, WebsiteElement } from "../../websiteElements/types";
import { duplicateWebsiteElement, moveSectionChild, reorderSectionChild, setSectionElementHidden, ungroupSectionElement, updateGroupChildren, type SectionChildFlow, type SectionChildReference } from "../sectionChildFlow";
import { addToGroup, groupAddKinds, reorderGroupChildren, type GroupAddKind } from "./sectionChildListHelpers";
import { StructureActionMenu, StructureMenuAction } from "./StructureActionMenu";

const sortableId = (reference: SectionChildReference) => reference.kind === "specialized" ? "section-child:specialized:content" : `section-child:element:${reference.id}`;
const elementLabel = (element: WebsiteElement) => element.type === "compositionGroup" ? "Group" : element.type === "text" ? element.text.trim() || "Text" : element.type === "richText" ? richTextPlainText(element.document) || "Rich Text" : element.type === "divider" ? "Divider" : element.type === "media" ? "Media" : element.type;

export function SectionChildList({ sectionLabel, flow, selected, onSelect, onChange, onDuplicate, onDelete }: { sectionLabel: string; flow: SectionChildFlow; selected: SectionChildReference | null; onSelect: (reference: SectionChildReference) => void; onChange: (flow: SectionChildFlow) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }));
  const dragEnd = ({ active, over }: DragEndEvent) => { if (!over || active.id === over.id) return; const from = flow.order.find((item) => sortableId(item) === active.id); const to = flow.order.find((item) => sortableId(item) === over.id); if (from && to) onChange(reorderSectionChild(flow, from, to)); };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={flow.order.map(sortableId)} strategy={verticalListSortingStrategy}><div className="space-y-0.5 border-l border-border/60 pl-1.5" role="group" aria-label={`${sectionLabel} structure`}>{flow.order.map((reference, index) => <TopLevelRow key={sortableId(reference)} reference={reference} index={index} sectionLabel={sectionLabel} flow={flow} selectedElementId={selected?.kind === "element" ? selected.id : undefined} selected={selected ? sortableId(selected) === sortableId(reference) : false} onSelect={onSelect} onChange={onChange} onDuplicate={onDuplicate} onDelete={onDelete} />)}</div></SortableContext></DndContext>;
}

function TopLevelRow({ reference, index, sectionLabel, flow, selected, selectedElementId, onSelect, onChange, onDuplicate, onDelete }: { reference: SectionChildReference; index: number; sectionLabel: string; flow: SectionChildFlow; selected: boolean; selectedElementId?: string; onSelect: (reference: SectionChildReference) => void; onChange: (flow: SectionChildFlow) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId(reference) });
  const element = reference.kind === "element" ? flow.elements.find(({ id }) => id === reference.id) : undefined;
  const label = reference.kind === "specialized" ? `${sectionLabel} content` : element ? elementLabel(element) : "Unknown element";
  const add = element?.type === "compositionGroup" ? (kind: GroupAddKind) => addToGroup(element, kind, flow, onChange, onSelect) : undefined;
  const isGroup = element?.type === "compositionGroup";
  return <div><div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} data-structure-row={isGroup ? "group" : "element"} data-element-hidden={element?.isHidden ? "true" : undefined} className={`group/structure-row relative flex min-w-0 items-center gap-0.5 rounded-md border px-0.5 py-0.5 ${selected ? "border-accent bg-surface-muted" : isGroup ? "border-border/50 bg-surface-muted/35 hover:border-border hover:bg-surface-muted" : "border-transparent hover:bg-surface-muted"} ${isDragging ? "z-20 opacity-70 shadow-lg" : ""}`}>
    <IconButton type="button" size="sm" className={`touch-none cursor-grab opacity-35 active:cursor-grabbing group-hover/structure-row:opacity-100 focus-visible:opacity-100 ${selected ? "opacity-100" : ""}`} aria-label={`Drag ${label}`} {...attributes} {...listeners}><GripVertical size={14} /></IconButton>
    {isGroup && <GroupDisclosure expanded={expanded} onToggle={() => setExpanded((value) => !value)} />}
    <RowLabel label={label} hidden={element?.isHidden === true} selected={selected} onClick={() => onSelect(reference)} />
    {element?.isHidden && <HiddenIndicator />}
    {add && <GroupAddControl depth={1} label="Add child to Group" onAdd={add} />}
    <StructureActionMenu className="shrink-0" label={`${label} actions`}><>{element && <ElementVisibilityAction element={element} onToggle={() => onChange(setSectionElementHidden(flow, element.id, !element.isHidden))} />}{reference.kind === "element" && <StructureMenuAction icon={<Copy size={14} />} onClick={() => onDuplicate(reference.id)}>Duplicate</StructureMenuAction>}<StructureMenuAction icon={<ArrowUp size={14} />} disabled={index === 0} onClick={() => onChange(moveSectionChild(flow, reference, -1))}>Move up</StructureMenuAction><StructureMenuAction icon={<ArrowDown size={14} />} disabled={index === flow.order.length - 1} onClick={() => onChange(moveSectionChild(flow, reference, 1))}>Move down</StructureMenuAction>{isGroup && <StructureMenuAction icon={<Ungroup size={14} />} onClick={() => onChange(ungroupSectionElement(flow, element.id))}>Ungroup</StructureMenuAction>}{reference.kind === "element" && <StructureMenuAction danger icon={<Trash2 size={14} />} onClick={() => onDelete(reference.id)}>Delete</StructureMenuAction>}</></StructureActionMenu>
  </div>{element?.type === "compositionGroup" && expanded && <GroupChildren group={element} depth={1} flow={flow} selectedElementId={selectedElementId} onSelect={onSelect} onChange={onChange} />}</div>;
}

function GroupChildren({ group, depth, flow, selectedElementId, onSelect, onChange }: { group: CompositionGroup; depth: number; flow: SectionChildFlow; selectedElementId?: string; onSelect: (reference: SectionChildReference) => void; onChange: (flow: SectionChildFlow) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }));
  const itemId = (id: string) => `group-child:${group.id}:${id}`;
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = group.children.findIndex(({ id }) => itemId(id) === active.id);
    const to = group.children.findIndex(({ id }) => itemId(id) === over.id);
    if (from < 0 || to < 0) return;
    onChange(updateGroupChildren(flow, group.id, reorderGroupChildren(group, from, to)));
  };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={group.children.map(({ id }) => itemId(id))} strategy={verticalListSortingStrategy}><div className="ml-3 space-y-0.5 border-l border-border/50 pl-1.5" data-group-children={group.id}>{group.children.map((child, index) => <NestedRow key={child.id} sortableId={itemId(child.id)} child={child as WebsiteElement} index={index} group={group} depth={depth} flow={flow} selectedElementId={selectedElementId} onSelect={onSelect} onChange={onChange} />)}</div></SortableContext></DndContext>;
}

function NestedRow({ child, sortableId: childSortableId, index, group, depth, flow, selectedElementId, onSelect, onChange }: { child: WebsiteElement; sortableId: string; index: number; group: CompositionGroup; depth: number; flow: SectionChildFlow; selectedElementId?: string; onSelect: (reference: SectionChildReference) => void; onChange: (flow: SectionChildFlow) => void }) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: childSortableId });
  const replace = (children: CompositionGroup["children"]) => onChange(updateGroupChildren(flow, group.id, children));
  const label = elementLabel(child);
  const selected = selectedElementId === child.id;
  const isGroup = child.type === "compositionGroup";
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "relative z-20 opacity-70 shadow-lg" : ""}><div data-structure-row={isGroup ? "nested-group" : "nested-element"} data-element-hidden={child.isHidden ? "true" : undefined} className={`group/structure-row flex min-w-0 items-center gap-0.5 rounded-md border px-0.5 py-0.5 ${selected ? "border-accent bg-surface-muted" : isGroup ? "border-border/50 bg-surface-muted/35 hover:border-border hover:bg-surface-muted" : "border-transparent hover:bg-surface-muted"}`}>
    <IconButton type="button" size="sm" className={`touch-none cursor-grab opacity-35 active:cursor-grabbing group-hover/structure-row:opacity-100 focus-visible:opacity-100 ${selected ? "opacity-100" : ""}`} aria-label={`Drag ${label}`} {...attributes} {...listeners}><GripVertical size={14} /></IconButton>
    {isGroup && <GroupDisclosure expanded={expanded} onToggle={() => setExpanded((value) => !value)} />}
    <RowLabel label={label} hidden={child.isHidden === true} selected={selected} onClick={() => onSelect({ kind: "element", id: child.id })} />
    {child.isHidden && <HiddenIndicator />}
    {isGroup && <GroupAddControl depth={depth + 1} label="Add child to Group" onAdd={(kind) => addToGroup(child, kind, flow, onChange, onSelect)} />}
    <StructureActionMenu className="shrink-0" label={`${label} actions`}><><ElementVisibilityAction element={child} onToggle={() => onChange(setSectionElementHidden(flow, child.id, !child.isHidden))} /><StructureMenuAction icon={<Copy size={14} />} onClick={() => { const next = [...group.children]; next.splice(index + 1, 0, duplicateWebsiteElement(child) as typeof group.children[number]); replace(next); }}>Duplicate</StructureMenuAction><StructureMenuAction icon={<ArrowUp size={14} />} disabled={index === 0} onClick={() => { const next = [...group.children]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; replace(next); }}>Move up</StructureMenuAction><StructureMenuAction icon={<ArrowDown size={14} />} disabled={index === group.children.length - 1} onClick={() => { const next = [...group.children]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; replace(next); }}>Move down</StructureMenuAction>{isGroup && <StructureMenuAction icon={<Ungroup size={14} />} onClick={() => onChange(ungroupSectionElement(flow, child.id))}>Ungroup</StructureMenuAction>}<StructureMenuAction danger icon={<Trash2 size={14} />} onClick={() => replace(group.children.filter(({ id }) => id !== child.id))}>Delete</StructureMenuAction></></StructureActionMenu>
  </div>{child.type === "compositionGroup" && expanded && <GroupChildren group={child} depth={depth + 1} flow={flow} selectedElementId={selectedElementId} onSelect={onSelect} onChange={onChange} />}</div>;
}

export function GroupDisclosure({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return <IconButton className="size-7" size="sm" type="button" aria-label={`${expanded ? "Collapse" : "Expand"} Group`} aria-expanded={expanded} onClick={onToggle}><ChevronDown size={14} className={`transition-transform ${expanded ? "" : "-rotate-90"}`} /></IconButton>;
}

function RowLabel({ label, hidden, selected, onClick }: { label: string; hidden: boolean; selected: boolean; onClick: () => void }) {
  return <button type="button" title={label} className={`min-w-0 flex-1 rounded px-1 py-1.5 text-left ${hidden ? "text-foreground-muted opacity-60" : ""}`} aria-current={selected ? "true" : undefined} onClick={onClick}><span className="block truncate text-xs font-medium">{label}</span></button>;
}

function HiddenIndicator() {
  return <span className="grid size-6 shrink-0 place-items-center text-foreground-muted" role="img" aria-label="Hidden" title="Hidden"><EyeOff size={14} aria-hidden="true" /></span>;
}

function GroupAddControl({ depth, label, onAdd }: { depth: number; label: string; onAdd: (kind: GroupAddKind) => void }) {
  const [open, setOpen] = useState(false);
  const labels: Record<GroupAddKind, string> = { text: "Text", richText: "Rich Text", divider: "Divider", media: "Media", group: "Group" };
  return <div className="relative shrink-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}><IconButton type="button" size="sm" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Plus size={15} /></IconButton>{open && <div role="menu" aria-label={label} className="absolute right-0 top-full z-40 w-36 rounded-md border border-border bg-surface p-1 text-xs shadow-[var(--shadow-dialog)]">{groupAddKinds(depth).map((kind) => <AddAction key={kind} label={labels[kind]} onClick={() => { onAdd(kind); setOpen(false); }} />)}</div>}</div>;
}
function AddAction({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" role="menuitem" className="block w-full rounded px-2 py-1.5 text-left hover:bg-surface-muted" onClick={onClick}>{label}</button>; }

export function ElementVisibilityAction({ element, onToggle }: { element: WebsiteElement; onToggle: () => void }) {
  return <StructureMenuAction icon={element.isHidden ? <Eye size={14} /> : <EyeOff size={14} />} onClick={onToggle}>{element.isHidden ? "Show" : "Hide"}</StructureMenuAction>;
}

import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { IconButton } from "../../../components/ui/IconButton";
import { narrativeIdFromStoryReference, resolveStoryStructure, storyFieldFromReference } from "../storyStructure";
import type { StoryBlock, StoryContent, StoryHeaderField, StoryStructureReference } from "../types";
import { StructureActionMenu, StructureMenuAction } from "./StructureActionMenu";

type Props = {
  content: StoryContent;
  selectedReference: StoryStructureReference | null;
  limitReached: boolean;
  onSelect: (reference: StoryStructureReference) => void;
  onDuplicate: (blockId: string) => void;
  onRemove: (blockId: string) => void;
  onMove: (reference: StoryStructureReference, direction: -1 | 1) => void;
  onToggleHidden: (reference: StoryStructureReference) => void;
  onReorder: (active: StoryStructureReference, over: StoryStructureReference) => void;
};

export function StoryBlockList(props: Props) {
  const order = resolveStoryStructure(props.content);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) props.onReorder(String(active.id) as StoryStructureReference, String(over.id) as StoryStructureReference);
  };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
    <SortableContext items={order} strategy={verticalListSortingStrategy}>
      <div className="space-y-0.5 border-l border-border pl-2" role="group" aria-label="Story structure">
        {order.map((reference, index) => <SortableStoryItem key={reference} {...props} reference={reference} index={index} length={order.length} selected={reference === props.selectedReference} />)}
      </div>
    </SortableContext>
  </DndContext>;
}

function SortableStoryItem({ content, reference, index, length, selected, limitReached, onSelect, onDuplicate, onRemove, onMove, onToggleHidden }: Props & { reference: StoryStructureReference; index: number; length: number; selected: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: reference });
  const field = storyFieldFromReference(reference);
  const blockId = narrativeIdFromStoryReference(reference);
  const block = blockId ? content.elements.find(({ id }) => id === blockId) : undefined;
  const metadata = field ? singletonMetadata(content, field) : block ? narrativeMetadata(block, content.elements.indexOf(block)) : null;
  if (!metadata) return null;
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`relative flex min-w-0 items-center gap-0.5 rounded-md border px-1 py-0.5 ${selected ? "border-accent bg-surface-muted" : "border-transparent hover:bg-surface-muted"} ${isDragging ? "z-20 opacity-70 shadow-lg" : ""}`}>
    <IconButton type="button" size="sm" className="touch-none cursor-grab active:cursor-grabbing" aria-label={`Drag ${metadata.label}`} {...attributes} {...listeners}><GripVertical size={15} /></IconButton>
    <button type="button" className="min-w-0 flex-1 rounded px-1 py-1.5 text-left" onClick={() => onSelect(reference)} aria-current={selected ? "true" : undefined}><span className={`block truncate text-xs font-medium ${metadata.hidden ? "text-foreground-muted" : ""}`}>{metadata.label}</span></button>
    {(metadata.hidden || metadata.empty) && <span className="shrink-0 rounded bg-surface-muted px-1 py-0.5 text-[9px] text-foreground-muted">{metadata.hidden ? "Hidden" : "Empty"}</span>}
    <StructureActionMenu label={`${metadata.label} actions`}>
      {block && <StructureMenuAction icon={<Copy size={14} />} disabled={limitReached} onClick={() => onDuplicate(block.id)}>Duplicate</StructureMenuAction>}
      <StructureMenuAction icon={<ArrowUp size={14} />} disabled={index === 0} onClick={() => onMove(reference, -1)}>Move up</StructureMenuAction>
      <StructureMenuAction icon={<ArrowDown size={14} />} disabled={index === length - 1} onClick={() => onMove(reference, 1)}>Move down</StructureMenuAction>
      <StructureMenuAction icon={metadata.hidden ? <Eye size={14} /> : <EyeOff size={14} />} onClick={() => onToggleHidden(reference)}>{metadata.hidden ? "Show" : "Hide"}</StructureMenuAction>
      {block && <StructureMenuAction danger icon={<Trash2 size={14} />} onClick={() => onRemove(block.id)}>Delete</StructureMenuAction>}
    </StructureActionMenu>
  </div>;
}

function singletonMetadata(content: StoryContent, field: StoryHeaderField) {
  return { label: field === "eyebrow" ? "Eyebrow" : field === "heading" ? "Heading" : "Intro", hidden: content[`${field}IsHidden`] === true, empty: !content[field]?.trim() };
}

function narrativeMetadata(block: StoryBlock, index: number) {
  const label = block.slots.heading.text.trim() || block.slots.eyebrow.text.trim() || `Story block ${index + 1}`;
  return { label, hidden: Boolean(block.isHidden), empty: !hasVisibleAuthoredContent(block) };
}

function hasVisibleAuthoredContent(block: StoryBlock) {
  const { slots } = block;
  return (!slots.eyebrow.isHidden && Boolean(slots.eyebrow.text.trim())) || (!slots.heading.isHidden && Boolean(slots.heading.text.trim())) || !slots.divider.isHidden || (!slots.body.isHidden && Boolean(slots.body.text.trim())) || (!slots.quote.isHidden && Boolean(slots.quote.text.trim())) || (!slots.media.isHidden && Boolean(slots.media.content)) || (!slots.caption.isHidden && Boolean(slots.caption.text.trim())) || (!slots.cta.isHidden && Boolean(slots.cta.label.trim()));
}

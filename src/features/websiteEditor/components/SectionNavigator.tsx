import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heading } from "../../../components/ui/Heading";
import { IconButton } from "../../../components/ui/IconButton";
import { Text } from "../../../components/ui/Text";
import { Tooltip } from "../../../components/ui/Tooltip";
import {
  STORY_BLOCK_LIMIT,
  addStoryBlock,
  duplicateStoryBlock,
  moveStoryBlock,
  removeStoryBlock,
  reorderStoryBlocks,
} from "../storyBlockOperations";
import type { StoryContent, StoryHeaderField, WebsiteSection } from "../types";
import type { StoryStructureReference } from "../types";
import { narrativeIdFromStoryReference, narrativeStoryReference, storyFieldFromReference } from "../storyStructure";
import { StoryBlockList } from "./StoryBlockList";
import { SectionChildList } from "./SectionChildList";
import { SECTION_SPECIALIZED_REFERENCE, createDividerElement, createGroupElement, createRichTextElement, createTextElement, deleteSectionElement, duplicateSectionElement, insertSectionElement, type SectionChildFlow, type SectionChildReference } from "../sectionChildFlow";
import {
  StructureActionMenu,
  StructureMenuAction,
} from "./StructureActionMenu";

type Props = {
  sections: WebsiteSection[];
  selectedId: string | null;
  selectedNarrativeBlockId: string | null;
  selectedStoryHeaderField: StoryHeaderField | null;
  workingStory: { sectionId: string; content: StoryContent } | null;
  workingChildFlow: { sectionId: string; flow?: SectionChildFlow } | null;
  selectedChild: { sectionId: string; reference: SectionChildReference } | null;
  genericChildSectionIds: readonly string[];
  pending: boolean;
  onSelect: (id: string, requestCanvasScroll?: boolean) => void;
  onNarrativeBlockSelect: (blockId: string | null, requestCanvasScroll?: boolean) => void;
  onStoryHeaderSelect: (sectionId: string, field: StoryHeaderField, requestCanvasScroll?: boolean) => void;
  onStoryChange: (sectionId: string, content: StoryContent) => boolean;
  onChildFlowChange: (sectionId: string, flow: SectionChildFlow | undefined, selection?: SectionChildReference) => boolean;
  onChildSelect: (sectionId: string, reference: SectionChildReference) => void;
  onToggle: (section: WebsiteSection) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onReorder: (sectionIds: string[]) => void;
};

const sortableSectionId = (id: string) => `section:${id}`;

export function SectionNavigator(props: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  );
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || props.pending) return;
    const from = props.sections.findIndex(
      ({ id }) => sortableSectionId(id) === active.id,
    );
    const to = props.sections.findIndex(
      ({ id }) => sortableSectionId(id) === over.id,
    );
    if (from < 0 || to < 0) return;
    props.onReorder(
      arrayMove(
        props.sections.map(({ id }) => id),
        from,
        to,
      ),
    );
  };
  return (
    <section
      className="rounded-2xl border border-border bg-surface p-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0"
      aria-label="Website sections"
    >
      <div className="px-2 py-2">
        <Heading level={2} variant="section">
          Sections
        </Heading>
        <Text className="mt-0.5" variant="helper">
          Select, reorder, or change visibility.
        </Text>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={dragEnd}
      >
        <SortableContext
          items={props.sections.map(({ id }) => sortableSectionId(id))}
          strategy={verticalListSortingStrategy}
        >
          <div className="mt-1 space-y-1">
            {props.sections.map((section, index) => (
              <SortableSection
                key={section.id}
                {...props}
                section={section}
                index={index}
                expanded={expanded[section.id] ?? true}
                onExpandedChange={(value) =>
                  setExpanded((current) => ({
                    ...current,
                    [section.id]: value,
                  }))
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableSection(
  props: Props & {
    section: WebsiteSection;
    index: number;
    expanded: boolean;
    onExpandedChange: (value: boolean) => void;
  },
) {
  const { section, index } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableSectionId(section.id),
    disabled: props.pending,
  });
  const isStory = section.type === "story";
  const supportsGenericChildren = props.genericChildSectionIds.includes(section.type);
  const storyContent = isStory
    ? props.workingStory?.sectionId === section.id
      ? props.workingStory.content
      : (section.content as StoryContent)
    : null;
  const childFlow = supportsGenericChildren
    ? props.workingChildFlow?.sectionId === section.id
      ? props.workingChildFlow.flow
      : (section.content as { childFlow?: SectionChildFlow }).childFlow
    : undefined;
  const resolvedChildFlow: SectionChildFlow = childFlow ?? { elements: [], order: [SECTION_SPECIALIZED_REFERENCE] };
  const hasSelectedChild = props.selectedChild?.sectionId === section.id;
  const mutateStory = (
    content: StoryContent,
    nextSelection?: StoryStructureReference | null,
  ) => {
    if (!props.onStoryChange(section.id, content)) return;
    if (nextSelection !== undefined) selectStoryReference(nextSelection);
  };
  const selectedReference: StoryStructureReference | null = props.selectedId !== section.id
    ? null
    : props.selectedStoryHeaderField
      ? `story:${props.selectedStoryHeaderField}`
      : props.selectedNarrativeBlockId
        ? narrativeStoryReference(props.selectedNarrativeBlockId)
        : null;
  const selectStoryReference = (
    reference: StoryStructureReference | null,
    requestCanvasScroll = false,
  ) => {
    if (reference === null) {
      props.onSelect(section.id, requestCanvasScroll);
      return;
    }
    const field = storyFieldFromReference(reference);
    if (field)
      props.onStoryHeaderSelect(section.id, field, requestCanvasScroll);
    else {
      const blockId = narrativeIdFromStoryReference(reference);
      if (blockId) {
        props.onSelect(section.id);
        props.onNarrativeBlockSelect(blockId, requestCanvasScroll);
      }
    }
  };
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-20 opacity-70 shadow-lg" : ""}
    >
      <div
        className={`group flex min-w-0 items-center gap-0.5 rounded-lg border px-1 py-1 ${props.selectedId === section.id && !selectedReference && !hasSelectedChild ? "border-accent border-2 bg-surface-muted" : "border-transparent hover:bg-surface-muted"} ${section.isEnabled ? "" : "bg-surface-muted/60 text-foreground-muted"}`}
      >
        <IconButton
          type="button"
          size="sm"
          className="touch-none cursor-grab active:cursor-grabbing"
          disabled={props.pending}
          aria-label={`Drag ${section.displayName} section`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </IconButton>
        <button
          className="min-w-0 flex-1 rounded px-1.5 py-1.5 text-left"
          type="button"
          onClick={() => props.onSelect(section.id, true)}
          aria-current={
            props.selectedId === section.id && !selectedReference && !hasSelectedChild
              ? "true"
              : undefined
          }
        >
          <span className="block truncate text-sm font-medium">
            {section.displayName}
          </span>
        </button>
        {!section.isEnabled && (
          <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[9px] text-foreground-muted">
            Hidden
          </span>
        )}
        {(isStory && storyContent) && (
          <ElementAddControl
            triggerLabel="Add to Story"
            items={[{ label: "Narrative Block", onAdd: () => {
              const result = addStoryBlock(storyContent, selectedReference);
              if (!result) return;
              props.onExpandedChange(true);
              mutateStory(result.content, narrativeStoryReference(result.blockId));
            } }]}
            disabled={storyContent.elements.length >= STORY_BLOCK_LIMIT}
            onOpen={() => {
              if (props.selectedId !== section.id) props.onSelect(section.id);
            }}
          />
        )}
        {supportsGenericChildren && <ElementAddControl triggerLabel={`Add to ${section.displayName}`} disabled={resolvedChildFlow.elements.length >= 20} onOpen={() => { if (props.selectedId !== section.id) props.onSelect(section.id); }} items={[{ label: "Text", onAdd: () => addGeneric(createTextElement()) }, { label: "Rich Text", onAdd: () => addGeneric(createRichTextElement()) }, { label: "Divider", onAdd: () => addGeneric(createDividerElement()) }, { label: "Group", onAdd: () => addGeneric(createGroupElement()) }]} />}
        {(isStory || supportsGenericChildren) && (
          <IconButton
            size="sm"
            type="button"
            onClick={() => props.onExpandedChange(!props.expanded)}
            aria-label={`${props.expanded ? "Collapse" : "Expand"} ${section.displayName}`}
            aria-expanded={props.expanded}
          >
            <ChevronDown
              className={`transition-transform ${props.expanded ? "" : "-rotate-90"}`}
              size={15}
            />
          </IconButton>
        )}
        <StructureActionMenu label={`${section.displayName} actions`}>
          <StructureMenuAction
            icon={<ArrowUp size={14} />}
            disabled={props.pending || index === 0}
            onClick={() => props.onMove(index, -1)}
          >
            Move up
          </StructureMenuAction>
          <StructureMenuAction
            icon={<ArrowDown size={14} />}
            disabled={props.pending || index === props.sections.length - 1}
            onClick={() => props.onMove(index, 1)}
          >
            Move down
          </StructureMenuAction>
          <StructureMenuAction
            icon={section.isEnabled ? <EyeOff size={14} /> : <Eye size={14} />}
            disabled={props.pending}
            onClick={() => props.onToggle(section)}
          >
            {section.isEnabled ? "Hide" : "Show"}
          </StructureMenuAction>
        </StructureActionMenu>
      </div>
      {isStory && props.expanded && storyContent && (
        <div className="ml-5 mt-0.5">
          <StoryBlockList
            content={storyContent}
            selectedReference={selectedReference}
            limitReached={storyContent.elements.length >= STORY_BLOCK_LIMIT}
            onSelect={(reference) => selectStoryReference(reference, true)}
            onDuplicate={(blockId) => {
              const result = duplicateStoryBlock(storyContent, blockId);
              if (result) mutateStory(result.content, narrativeStoryReference(result.blockId));
            }}
            onRemove={(blockId) => {
              const result = removeStoryBlock(storyContent, blockId);
              if (result) mutateStory(result.content, result.selectedReference);
            }}
            onMove={(reference, direction) =>
              mutateStory(
                moveStoryBlock(storyContent, reference, direction),
                reference,
              )
            }
            onToggleHidden={(reference) => {
              const field = storyFieldFromReference(reference);
              const blockId = narrativeIdFromStoryReference(reference);
              mutateStory(field ? {
                ...storyContent,
                [`${field}IsHidden`]: storyContent[`${field}IsHidden`] !== true,
              } : {
                ...storyContent,
                elements: storyContent.elements.map((block) => block.id === blockId ? { ...block, isHidden: !block.isHidden } : block),
              }, reference);
            }}
            onReorder={(active, over) =>
              mutateStory(
                reorderStoryBlocks(storyContent, active, over),
                active,
              )
            }
          />
        </div>
      )}
      {supportsGenericChildren && props.expanded && (
        <div className="ml-5 mt-0.5"><SectionChildList sectionLabel={section.displayName} flow={resolvedChildFlow} selected={props.selectedChild?.sectionId === section.id ? props.selectedChild.reference : null} onSelect={(reference) => props.onChildSelect(section.id, reference)} onChange={(flow) => { props.onChildFlowChange(section.id, flow, props.selectedChild?.sectionId === section.id ? props.selectedChild.reference : undefined); }} onDuplicate={(elementId) => { const result = duplicateSectionElement(resolvedChildFlow, elementId); if (result) props.onChildFlowChange(section.id, result.flow, { kind: "element", id: result.elementId }); }} onDelete={(elementId) => { const result = deleteSectionElement(resolvedChildFlow, elementId); props.onChildFlowChange(section.id, result.flow, result.selection); }} /></div>
      )}
    </div>
  );

  function addGeneric(element: ReturnType<typeof createTextElement> | ReturnType<typeof createRichTextElement> | ReturnType<typeof createDividerElement> | ReturnType<typeof createGroupElement>) {
    const after = props.selectedChild?.sectionId === section.id ? props.selectedChild.reference : SECTION_SPECIALIZED_REFERENCE;
    const flow = insertSectionElement(childFlow, element, after);
    props.onExpandedChange(true);
    props.onChildFlowChange(section.id, flow, { kind: "element", id: element.id });
  }
}

function ElementAddControl({
  disabled,
  onOpen,
  triggerLabel,
  items,
}: {
  disabled: boolean;
  onOpen: () => void;
  triggerLabel: string;
  items: Array<{ label: string; onAdd: () => void }>;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const sidebar = trigger?.closest(
        'section[aria-label="Website sections"]',
      );
      if (!trigger || !sidebar) return;
      const triggerBounds = trigger.getBoundingClientRect();
      const sidebarBounds = sidebar.getBoundingClientRect();
      const inset = 8;
      const width = Math.min(160, sidebarBounds.width - inset * 2);
      const left = Math.min(
        Math.max(triggerBounds.right - width, sidebarBounds.left + inset),
        sidebarBounds.right - width - inset,
      );
      const top = triggerBounds.bottom + 4;
      setPosition({
        left,
        top,
        width,
        maxHeight: Math.max(80, window.innerHeight - top - inset),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  return (
    <>
      <Tooltip label={triggerLabel}>
        <IconButton
          ref={triggerRef}
          size="sm"
          type="button"
          disabled={disabled}
          aria-label={triggerLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            onOpen();
            setOpen((current) => !current);
          }}
        >
          <Plus size={15} />
        </IconButton>
      </Tooltip>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Add element"
            className="fixed z-50 text-xs overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-[var(--shadow-dialog)]"
            style={position}
          >
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
              Add element
            </p>
            {items.map((item) => <button key={item.label} type="button" role="menuitem" className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-surface-muted" onClick={() => { setOpen(false); item.onAdd(); }}>{item.label}</button>)}
          </div>,
          document.body,
        )}
    </>
  );
}

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileWarning,
  ExternalLink,
  LayoutTemplate,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { Heading } from "../../components/ui/Heading";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Text } from "../../components/ui/Text";
import { useEventWorkspace } from "../../features/events/workspace/EventWorkspaceContext";
import {
  addWebsiteProjectColor,
  reorderWebsiteSections,
  setWebsiteSectionEnabled,
  updateWebsiteDesignSettings,
  updateWebsiteSectionAppearance,
  updateWebsiteSectionContent,
  updateWebsiteSectionDesignDefaults,
} from "../../features/websiteEditor/api";
import { AppearancePanel } from "../../features/websiteEditor/components/AppearancePanel";
import { BuilderSaveBar } from "../../features/websiteEditor/components/BuilderSaveBar";
import { DesignPanel } from "../../features/websiteEditor/components/DesignPanel";
import { DiscardChangesDialog } from "../../features/websiteEditor/components/DiscardChangesDialog";
import { SectionEditor } from "../../features/websiteEditor/components/SectionEditor";
import { NarrativeBlockContentPanel } from "../../features/websiteEditor/components/NarrativeBlockContentPanel";
import { NarrativeBlockAppearancePanel } from "../../features/websiteEditor/components/NarrativeBlockAppearancePanel";
import { StorySingletonAppearancePanel } from "../../features/websiteEditor/components/StorySingletonAppearancePanel";
import { TextElementEditor } from "../../features/websiteEditor/components/TextElementEditor";
import { RichTextElementEditor } from "../../features/websiteEditor/components/RichTextElementEditor";
import { GroupElementEditor } from "../../features/websiteEditor/components/GroupElementEditor";
import { DividerElementEditor } from "../../features/websiteEditor/components/DividerElementEditor";
import { MediaElementEditor } from "../../features/websiteEditor/components/MediaElementEditor";
import { SectionDesignDefaultsPanel } from "../../features/websiteEditor/components/SectionDesignDefaultsPanel";
import { SectionNavigator } from "../../features/websiteEditor/components/SectionNavigator";
import { validateSectionContent } from "../../features/websiteEditor/schemas";
import { InlineEditProvider } from "../../features/websiteEditor/inline/InlineEditContext";
import type {
  InlineFieldPath,
  InlineEditingTarget,
} from "../../features/websiteEditor/inline/types";
import type {
  ResponsiveViewport,
  StoryHeaderField,
  WebsiteDesignSettings,
  WebsiteDraft,
  SectionDesignDefaults,
  WebsiteSection,
  WebsiteSectionAppearance,
} from "../../features/websiteEditor/types";
import type { ProjectColor } from "../../features/websiteColors/projectColors";
import {
  appearanceEquals,
  pruneResponsiveAppearance,
  resolveSectionAppearanceForViewport,
} from "../../features/websiteEditor/responsiveAppearance";
import {
  accessiblePreviewViewports,
  PREVIEW_WIDTHS,
  useEditorDeviceCategory,
} from "../../features/websiteEditor/responsiveViewport";
import { useWebsiteDraft } from "../../features/websiteEditor/useWebsiteDraft";
import { WebsiteRenderer } from "../../features/websiteRenderer/WebsiteRenderer";
import { EditorSelectionContext } from "../../features/websiteRenderer/EditorSelectionContext";
import { NarrativeSlotFocusContext } from "../../features/websiteRenderer/NarrativeSlotFocusContext";
import { isNarrativeTypographySlot, type NarrativeSlotKey, type NarrativeTypographySlotKey } from "../../features/websiteEditor/narrativeSlotFocus";
import {
  globalDesignCapability,
  sectionCapability,
  templateElementCapability,
} from "../../features/websiteCapabilities/lookup";
import type { TemplateCapabilities } from "../../features/websiteCapabilities/types";
import { ApiError } from "../../lib/api";
import { findSectionElement, ungroupSectionElement, updateSectionElement, updateSectionRichTextAppearance, updateSectionTextElement, type SectionChildFlow, type SectionChildReference } from "../../features/websiteEditor/sectionChildFlow";
import { syncEditorPreviewTheme } from "../../features/websiteEditor/editorPreviewTheme";
import type { WebsiteElement } from "../../features/websiteElements/types";
import { findEditorTarget, revealEditorTarget } from "../../features/websiteEditor/canvasReveal";

type BuilderMode = "content" | "design";
type SectionPanelMode = "content" | "appearance";
type DrawerMode = "sections" | "content" | "appearance" | "design";
type MobileDrawerSnap = "hidden" | "medium" | "tall";
type EditorMode = "edit" | "preview";
type CanvasSelectionRequest =
  | { kind: "section"; id: string; requestId: number }
  | { kind: "storyField"; id: StoryHeaderField; sectionId: string; requestId: number }
  | { kind: "narrative"; id: string; requestId: number }
  | { kind: "narrativeSlot"; id: string; slot: NarrativeSlotKey; requestId: number }
  | { kind: "element"; id: string; sectionId: string; requestId: number };
type SectionStructureOverride = {
  order: string[];
  enabledById: Record<string, boolean>;
};

function applySectionStructure(
  sections: WebsiteSection[],
  override: SectionStructureOverride | null,
): WebsiteSection[] {
  if (!override) return sections;
  const byId = new Map(sections.map((section) => [section.id, section]));
  return override.order.flatMap((id, index) => {
    const section = byId.get(id);
    return section
      ? [{
          ...section,
          sortOrder: (index + 1) * 10,
          isEnabled: override.enabledById[id] ?? section.isEnabled,
        }]
      : [];
  });
}

function structureFor(sections: WebsiteSection[]): SectionStructureOverride {
  return {
    order: sections.map(({ id }) => id),
    enabledById: Object.fromEntries(
      sections.map(({ id, isEnabled }) => [id, isEnabled]),
    ),
  };
}

function messageFor(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export function WebsitePage() {
  const event = useEventWorkspace();
  const { projectId = "" } = useParams();
  const { draft, setDraft, error, isLoading, isUninitialized, retry } =
    useWebsiteDraft(event.id, projectId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [pendingStoryHeaderSelection, setPendingStoryHeaderSelection] = useState<{ sectionId: string; field: StoryHeaderField; requestId: number; focusInspector: boolean } | null>(null);
  const [pendingChildSelection, setPendingChildSelection] = useState<{ sectionId: string; reference: SectionChildReference; requestCanvasScroll?: boolean } | null>(null);
  const [pendingMode, setPendingMode] = useState<BuilderMode | null>(null);
  const [mode, setMode] = useState<BuilderMode>("content");
  const [editorMode, setEditorMode] = useState<EditorMode>("edit");
  const [sectionPanelMode, setSectionPanelMode] =
    useState<SectionPanelMode>("content");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("content");
  const [drawerSnap, setDrawerSnap] = useState<MobileDrawerSnap>("medium");
  const [pendingDrawerMode, setPendingDrawerMode] = useState<DrawerMode | null>(
    null,
  );
  const [listPending, setListPending] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [sectionStructureOverride, setSectionStructureOverride] =
    useState<SectionStructureOverride | null>(null);
  const deviceCategory = useEditorDeviceCategory();
  const [previewMode, setPreviewMode] =
    useState<ResponsiveViewport>(deviceCategory);
  const accessibleViewports = useMemo(
    () => accessiblePreviewViewports(deviceCategory),
    [deviceCategory],
  );

  useEffect(() => {
    if (accessibleViewports.includes(previewMode)) return;
    const timer = window.setTimeout(
      () => setPreviewMode(accessibleViewports[0]),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [accessibleViewports, previewMode]);
  const [contentOverride, setContentOverride] = useState<{
    sectionId: string;
    content: Record<string, unknown>;
  } | null>(null);
  const [appearanceOverride, setAppearanceOverride] = useState<{
    sectionId: string;
    appearance: WebsiteSectionAppearance;
  } | null>(null);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [sectionDesignSaving, setSectionDesignSaving] = useState(false);
  const [sectionDesignError, setSectionDesignError] = useState<string | null>(
    null,
  );
  const [inlineEditingTarget, setInlineEditingTarget] =
    useState<InlineEditingTarget | null>(null);
  const [selectedNarrativeBlockId, setSelectedNarrativeBlockId] =
    useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<{ sectionId: string; reference: SectionChildReference } | null>(null);
  const [activeNarrativeSlot, setActiveNarrativeSlot] = useState<{ blockId: string; slot: NarrativeSlotKey } | null>(null);
  const [narrativeContentDisclosure, setNarrativeContentDisclosure] = useState<NarrativeSlotKey | null>(null);
  const [narrativeAppearanceDisclosure, setNarrativeAppearanceDisclosure] = useState<NarrativeTypographySlotKey | null>(null);
  const [storyHeaderSelection, setStoryHeaderSelection] = useState<{ sectionId: string; field: StoryHeaderField; requestId: number; focusInspector: boolean } | null>(null);
  const storyHeaderRequestId = useRef(0);
  const canvasSelectionRequestId = useRef(0);
  const [canvasSelectionRequest, setCanvasSelectionRequest] =
    useState<CanvasSelectionRequest | null>(null);
  const [designOverride, setDesignOverride] =
    useState<WebsiteDesignSettings | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);
  const [mediaOverrides, setMediaOverrides] = useState<WebsiteDraft["media"]>(
    {},
  );

  const workingSections = useMemo(
    () => applySectionStructure(draft?.sections ?? [], sectionStructureOverride),
    [draft?.sections, sectionStructureOverride],
  );
  const effectiveSelectedId = workingSections.some(
    ({ id }) => id === selectedId,
  )
    ? selectedId
    : (workingSections[0]?.id ?? null);
  const authoritativeSelected =
    draft?.sections.find(({ id }) => id === effectiveSelectedId) ?? null;
  const workingSelected =
    workingSections.find(({ id }) => id === effectiveSelectedId) ?? null;
  const workingContent =
    contentOverride?.sectionId === effectiveSelectedId
      ? contentOverride.content
      : (authoritativeSelected?.content as Record<string, unknown> | undefined);
  const workingAppearance =
    appearanceOverride?.sectionId === effectiveSelectedId
      ? appearanceOverride.appearance
      : authoritativeSelected?.appearance;
  const contentDirty = Boolean(
    authoritativeSelected &&
    workingContent &&
    JSON.stringify(workingContent) !==
      JSON.stringify(authoritativeSelected.content),
  );
  const appearanceDirty = Boolean(
    authoritativeSelected &&
    workingAppearance &&
    !appearanceEquals(workingAppearance, authoritativeSelected.appearance),
  );
  const sectionDirty = contentDirty || appearanceDirty;
  const designDirty = Boolean(
    draft &&
    designOverride &&
    JSON.stringify(designOverride) !== JSON.stringify(draft.designSettings),
  );
  const authoritativeOrder = draft?.sections.map(({ id }) => id) ?? [];
  const workingOrder = workingSections.map(({ id }) => id);
  const sectionOrderDirty =
    JSON.stringify(workingOrder) !== JSON.stringify(authoritativeOrder);
  const sectionVisibilityDirty = workingSections.some((section) =>
    draft?.sections.find(({ id }) => id === section.id)?.isEnabled !==
    section.isEnabled,
  );
  const sectionStructureDirty = sectionOrderDirty || sectionVisibilityDirty;
  const globalDirty = sectionStructureDirty || sectionDirty || designDirty;

  function selectSection(id: string, requestCanvasScroll = false) {
    if (requestCanvasScroll) {
      setCanvasSelectionRequest({
        kind: "section",
        id,
        requestId: ++canvasSelectionRequestId.current,
      });
    }
    setStoryHeaderSelection(null);
    if (id === effectiveSelectedId) {
      setInlineEditingTarget(null);
      setSelectedNarrativeBlockId(null);
      setSelectedChild(null);
      return;
    }
    if (sectionDirty) {
      setPendingStoryHeaderSelection(null);
      setPendingSelection(id);
    }
    else {
      setSelectedId(id);
      setSelectedChild(null);
      setContentOverride(null);
      setAppearanceOverride(null);
      setInlineEditingTarget(null);
      setSelectedNarrativeBlockId(null);
      setAppearanceError(null);
      setSectionDesignError(null);
    }
  }

  function applyDrawerMode(next: DrawerMode) {
    setDrawerMode(next);
    if (next === "content" || next === "appearance") setSectionPanelMode(next);
    if (next === "appearance") setInlineEditingTarget(null);
  }

  function changeMode(
    next: BuilderMode,
    nextDrawerMode: DrawerMode = next === "design" ? "design" : "content",
  ) {
    if (next === mode) {
      applyDrawerMode(nextDrawerMode);
      return;
    }
    if (
      (mode === "content" && sectionDirty) ||
      (mode === "design" && designDirty)
    ) {
      setPendingMode(next);
      setPendingDrawerMode(nextDrawerMode);
    } else {
      setMode(next);
      applyDrawerMode(nextDrawerMode);
      setContentOverride(null);
      setAppearanceOverride(null);
      setDesignOverride(null);
      setInlineEditingTarget(null);
      setSelectedNarrativeBlockId(null);
    }
  }

  function changeDrawerMode(next: DrawerMode) {
    if (next === "sections") {
      setDrawerMode(next);
      return;
    }
    changeMode(next === "design" ? "design" : "content", next);
  }

  function toggle(section: WebsiteSection) {
    const current = structureFor(workingSections);
    setSectionStructureOverride({
      ...current,
      enabledById: {
        ...current.enabledById,
        [section.id]: !section.isEnabled,
      },
    });
  }
  function move(index: number, direction: -1 | 1) {
    const ids = workingSections.map(({ id }) => id);
    const target = index + direction;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setSectionStructureOverride({
      ...structureFor(workingSections),
      order: ids,
    });
  }
  function reorderSections(ids: string[]) {
    setSectionStructureOverride({
      ...structureFor(workingSections),
      order: ids,
    });
  }

  function updateWorkingContent(content: Record<string, unknown>) {
    if (effectiveSelectedId) {
      setContentOverride({ sectionId: effectiveSelectedId, content });
      if (selectedNarrativeBlockId) {
        const exists =
          (
            content.elements as
              | import("../../features/websiteEditor/types").StoryBlock[]
              | undefined
          )?.some(({ id }) => id === selectedNarrativeBlockId) ?? false;
        if (!exists) {
          setSelectedNarrativeBlockId(null);
          setInlineEditingTarget(null);
        }
      }
    }
  }

  function resetSelectedSection() {
    setContentOverride(null);
    setAppearanceOverride(null);
    setInlineEditingTarget(null);
    setAppearanceError(null);
    setContentError(null);
    setMediaOverrides({});
    if (selectedNarrativeBlockId && authoritativeSelected?.type === "story") {
      const exists = (
        authoritativeSelected.content as import("../../features/websiteEditor/types").StoryContent
      ).elements.some(({ id }) => id === selectedNarrativeBlockId);
      if (!exists) setSelectedNarrativeBlockId(null);
    }
  }

  function selectNarrativeBlock(
    blockId: string | null,
    requestCanvasScroll = false,
  ) {
    if (blockId && requestCanvasScroll) {
      setCanvasSelectionRequest({
        kind: "narrative",
        id: blockId,
        requestId: ++canvasSelectionRequestId.current,
      });
    }
    setInlineEditingTarget(null);
    setStoryHeaderSelection(null);
    setSelectedChild(null);
    setSelectedNarrativeBlockId(blockId);
    if (!blockId || activeNarrativeSlot?.blockId !== blockId) setActiveNarrativeSlot(null);
  }

  function selectNarrativeSlot(blockId: string, slot: NarrativeSlotKey) {
    setSelectedNarrativeBlockId(blockId);
    setActiveNarrativeSlot({ blockId, slot });
    if (sectionPanelMode === "content") setNarrativeContentDisclosure(slot);
    else if (isNarrativeTypographySlot(slot)) setNarrativeAppearanceDisclosure(slot);
  }

  function openNarrativeSlotFromInspector(slot: NarrativeSlotKey | null, appearance = false) {
    if (appearance) setNarrativeAppearanceDisclosure(slot && isNarrativeTypographySlot(slot) ? slot : null);
    else setNarrativeContentDisclosure(slot);
    if (!slot || !selectedNarrativeBlockId) { if (!slot) setActiveNarrativeSlot(null); return; }
    setActiveNarrativeSlot({ blockId: selectedNarrativeBlockId, slot });
    setCanvasSelectionRequest({ kind: "narrativeSlot", id: selectedNarrativeBlockId, slot, requestId: ++canvasSelectionRequestId.current });
  }

  function selectStoryHeader(
    sectionId: string,
    field: StoryHeaderField,
    requestCanvasScroll = false,
  ) {
    if (requestCanvasScroll) {
      setCanvasSelectionRequest({
        kind: "storyField",
        id: field,
        sectionId,
        requestId: ++canvasSelectionRequestId.current,
      });
    }
    const target = { sectionId, field, requestId: ++storyHeaderRequestId.current, focusInspector: true };
    const changingSection = sectionId !== effectiveSelectedId;
    if ((changingSection && sectionDirty) || (mode === "design" && designDirty)) {
      if (changingSection) setPendingSelection(sectionId);
      setPendingMode("content");
      setPendingDrawerMode(sectionPanelMode);
      setPendingStoryHeaderSelection(target);
      return;
    }
    if (changingSection) {
      setSelectedId(sectionId);
      setContentOverride(null);
      setAppearanceOverride(null);
    }
    setMode("content");
    applyDrawerMode(sectionPanelMode);
    setInlineEditingTarget(null);
    setSelectedNarrativeBlockId(null);
    setSelectedChild(null);
    setStoryHeaderSelection(target);
  }

  function selectChild(sectionId: string, reference: SectionChildReference, requestCanvasScroll = false) {
    const target = { sectionId, reference };
    const section = workingSections.find(({ id }) => id === sectionId);
    const flow = (section?.content as { childFlow?: SectionChildFlow } | undefined)?.childFlow;
    const selectedElement = reference.kind === "element" ? findSectionElement(flow, reference.id) : undefined;
    const canvasEditedTextSelected = selectedElement?.type === "text" || selectedElement?.type === "richText" || selectedElement?.type === "divider" || selectedElement?.type === "compositionGroup";
    if (sectionId !== effectiveSelectedId && sectionDirty) {
      setPendingSelection(sectionId);
      setPendingChildSelection({ ...target, requestCanvasScroll });
      return;
    }
    if (sectionId !== effectiveSelectedId) {
      setSelectedId(sectionId);
      setContentOverride(null);
      setAppearanceOverride(null);
    }
    setInlineEditingTarget(null);
    setSelectedNarrativeBlockId(null);
    setStoryHeaderSelection(null);
    setSelectedChild(target);
    if (requestCanvasScroll && selectedElement && !selectedElement.isHidden) {
      setCanvasSelectionRequest({ kind: "element", id: selectedElement.id, sectionId, requestId: ++canvasSelectionRequestId.current });
    }
    setMode("content");
    setSectionPanelMode(canvasEditedTextSelected ? "appearance" : "content");
    applyDrawerMode(canvasEditedTextSelected ? "appearance" : "content");
  }

  function changeChildFlow(sectionId: string, flow: SectionChildFlow | undefined, selection?: SectionChildReference) {
    const section = workingSections.find(({ id }) => id === sectionId);
    if (!section) return false;
    if (sectionId !== effectiveSelectedId && sectionDirty) {
      setPendingSelection(sectionId);
      if (selection) setPendingChildSelection({ sectionId, reference: selection });
      return false;
    }
    const content = structuredClone(sectionId === effectiveSelectedId && workingContent ? workingContent : section.content as Record<string, unknown>);
    if (flow) content.childFlow = flow; else delete content.childFlow;
    if (sectionId !== effectiveSelectedId) {
      setSelectedId(sectionId);
      setAppearanceOverride(null);
    }
    setContentOverride({ sectionId, content });
    setInlineEditingTarget(null);
    setSelectedNarrativeBlockId(null);
    setStoryHeaderSelection(null);
    if (selection) {
      setSelectedChild({ sectionId, reference: selection });
      const selectedElement = selection.kind === "element" ? findSectionElement(flow, selection.id) : undefined;
      const canvasEditedTextSelected = selectedElement?.type === "text" || selectedElement?.type === "richText" || selectedElement?.type === "divider" || selectedElement?.type === "compositionGroup";
      if (canvasEditedTextSelected) {
        setSectionPanelMode("appearance");
        applyDrawerMode("appearance");
      }
    }
    return true;
  }

  function requestInlineEdit(target: InlineEditingTarget) {
    if (target.sectionId !== effectiveSelectedId) return;
    setInlineEditingTarget(target);
    if (target.narrativeBlockId) {
      setSelectedNarrativeBlockId(target.narrativeBlockId);
    } else if (target.elementId) {
      setSelectedNarrativeBlockId(null);
      setStoryHeaderSelection(null);
      setSelectedChild({ sectionId: target.sectionId, reference: { kind: "element", id: target.elementId } });
    } else {
      setSelectedNarrativeBlockId(null);
      const field = target.path[0];
      if (workingSelected?.type === "story" && (field === "eyebrow" || field === "heading" || field === "intro")) {
        setStoryHeaderSelection({ sectionId: target.sectionId, field, requestId: ++storyHeaderRequestId.current, focusInspector: false });
      }
    }
  }

  function changeEditorMode(next: EditorMode) {
    setEditorMode(next);
    if (next === "preview") setInlineEditingTarget(null);
  }

  function contentSaved(updated: WebsiteDraft) {
    setDraft(updated);
    setContentOverride(null);
    setInlineEditingTarget(null);
    setMediaOverrides({});
    if (selectedNarrativeBlockId) {
      const section = updated.sections.find(({ id }) => id === effectiveSelectedId);
      const exists =
        section?.type === "story" &&
        (
          section.content as import("../../features/websiteEditor/types").StoryContent
        ).elements.some(({ id }) => id === selectedNarrativeBlockId);
      if (!exists) setSelectedNarrativeBlockId(null);
    }
  }

  function updateInlineValue(target: InlineEditingTarget, value: string) {
    if (target.sectionId !== effectiveSelectedId || !workingContent) return;
    const next = structuredClone(workingContent);
    let path: InlineFieldPath = target.path;
    if (target.narrativeBlockId) {
      const elementIndex =
        (
          next.elements as
            | import("../../features/websiteEditor/types").StoryBlock[]
            | undefined
        )?.findIndex(({ id }) => id === target.narrativeBlockId) ?? -1;
      if (elementIndex < 0) {
        setInlineEditingTarget(null);
        setSelectedNarrativeBlockId(null);
        return;
      }
      path = ["elements", elementIndex, "slots", target.slot, "text"];
    } else if (target.elementId) {
      const flow = (next as { childFlow?: SectionChildFlow }).childFlow;
      const updatedFlow = flow ? updateSectionTextElement(flow, target.elementId, value) : null;
      if (!updatedFlow) {
        setInlineEditingTarget(null);
        setSelectedChild(null);
        return;
      }
      (next as { childFlow: SectionChildFlow }).childFlow = updatedFlow;
      setContentOverride({ sectionId: target.sectionId, content: next });
      return;
    }
    let cursor: unknown = next;
    path.forEach((part, index) => {
      if (Array.isArray(cursor) && typeof part === "number") {
        if (index === path.length - 1) cursor[part] = value;
        else cursor = cursor[part];
      } else if (
        cursor &&
        typeof cursor === "object" &&
        typeof part === "string"
      ) {
        const record = cursor as Record<string, unknown>;
        if (index === path.length - 1) record[part] = value;
        else cursor = record[part];
      }
    });
    setContentOverride({ sectionId: target.sectionId, content: next });
  }

  const previewDraft = useMemo(() => {
    if (!draft) return null;
    return {
      ...draft,
      media: { ...draft.media, ...mediaOverrides },
      designSettings: designOverride ?? draft.designSettings,
      sections: workingSections.map((section) => ({
        ...section,
        content:
          contentOverride?.sectionId === section.id
            ? contentOverride.content
            : section.content,
        appearance:
          appearanceOverride?.sectionId === section.id
            ? appearanceOverride.appearance
            : section.appearance,
      })),
    } as WebsiteDraft;
  }, [
    appearanceOverride,
    contentOverride,
    designOverride,
    draft,
    mediaOverrides,
    workingSections,
  ]);

  async function saveEditorChanges() {
    if (!draft) return;
    let domain: "structure" | "content" | "appearance" | "design" =
      "structure";
    let latestDraft = draft;
    const desiredStructure = structureFor(workingSections);
    setListPending(true);
    setListError(null);
    setContentError(null);
    setAppearanceError(null);
    setDesignError(null);
    try {
      if (sectionOrderDirty) {
        latestDraft = await reorderWebsiteSections(
          event.id,
          projectId,
          desiredStructure.order,
        );
        setDraft(latestDraft);
      }
      for (const sectionId of desiredStructure.order) {
        const persisted = latestDraft.sections.find(({ id }) => id === sectionId);
        const desiredEnabled = desiredStructure.enabledById[sectionId];
        if (!persisted || persisted.isEnabled === desiredEnabled) continue;
        latestDraft = await setWebsiteSectionEnabled(
          event.id,
          projectId,
          sectionId,
          desiredEnabled,
        );
        setDraft(latestDraft);
      }
      setSectionStructureOverride(null);

      if (contentDirty && selected && workingContent) {
        domain = "content";
        const parsed = validateSectionContent(selected.type, workingContent);
        if (!parsed.success) {
          setContentError(
            "Review this section and enter valid content before saving.",
          );
          return;
        }
        latestDraft = await updateWebsiteSectionContent(
          event.id,
          projectId,
          selected.id,
          parsed.data as Record<string, unknown>,
        );
        contentSaved(latestDraft);
      }

      if (appearanceDirty && effectiveSelectedId && workingAppearance) {
        domain = "appearance";
        latestDraft = await updateWebsiteSectionAppearance(
          event.id,
          projectId,
          effectiveSelectedId,
          pruneResponsiveAppearance(workingAppearance),
        );
        setDraft(latestDraft);
        setAppearanceOverride(null);
      }

      if (designDirty && designOverride) {
        domain = "design";
        latestDraft = await updateWebsiteDesignSettings(
          event.id,
          projectId,
          designOverride,
        );
        setDraft(latestDraft);
        setDesignOverride(null);
      }
    } catch (saveError) {
      if (domain === "structure") setListError(messageFor(saveError));
      else if (domain === "content") {
        setContentError(
          saveError instanceof ApiError
            ? saveError.validationErrors.content?.[0] ?? saveError.message
            : "Unable to save this section. Please try again.",
        );
      } else if (domain === "appearance") {
        setAppearanceError(messageFor(saveError));
      } else setDesignError(messageFor(saveError));
    } finally {
      setListPending(false);
    }
  }

  function resetEditorChanges() {
    setSectionStructureOverride(null);
    setDesignOverride(null);
    setDesignError(null);
    resetSelectedSection();
    setListError(null);
  }

  async function saveSectionDesignDefaults(defaults: SectionDesignDefaults) {
    if (!effectiveSelectedId) return;
    setSectionDesignSaving(true);
    setSectionDesignError(null);
    try {
      setDraft(
        await updateWebsiteSectionDesignDefaults(
          event.id,
          projectId,
          effectiveSelectedId,
          defaults,
        ),
      );
    } catch (saveError) {
      setSectionDesignError(messageFor(saveError));
    } finally {
      setSectionDesignSaving(false);
    }
  }

  async function addProjectColor(value: string): Promise<ProjectColor> {
    try {
      const updated = await addWebsiteProjectColor(event.id, projectId, value);
      const customColors = updated.designSettings.customColors;
      setDraft({
        ...draft!,
        designSettings: { ...draft!.designSettings, customColors },
      });
      setDesignOverride((current) => current ? { ...current, customColors } : null);
      const added = customColors.at(-1);
      if (!added) throw new Error("The color was saved but could not be loaded.");
      return added;
    } catch (addError) {
      if (addError instanceof ApiError) {
        throw new Error(addError.validationErrors.value?.[0] ?? addError.message, { cause: addError });
      }
      throw addError;
    }
  }

  if (isLoading) return <EditorLoading eventId={event.id} />;
  if (isUninitialized)
    return (
      <EditorError
        eventId={event.id}
        message="Website Project not found."
        retry={retry}
      />
    );
  if (error || !draft || !previewDraft)
    return (
      <EditorError
        eventId={event.id}
        message={messageFor(error)}
        retry={retry}
      />
    );
  const selected = workingSelected;
  const designSettings = designOverride ?? draft.designSettings;

  const sectionRail = (
    <SectionNavigator
      sections={workingSections}
      selectedId={effectiveSelectedId}
      selectedNarrativeBlockId={selectedNarrativeBlockId}
      selectedStoryHeaderField={storyHeaderSelection?.sectionId === effectiveSelectedId ? storyHeaderSelection.field : null}
      workingStory={selected?.type === "story" && workingContent ? { sectionId: selected.id, content: workingContent as import("../../features/websiteEditor/types").StoryContent } : null}
      workingChildFlow={selected && workingContent && (selected.type === "date" || selected.type === "dressCode") ? { sectionId: selected.id, flow: (workingContent as { childFlow?: SectionChildFlow }).childFlow } : null}
      selectedChild={selectedChild}
      genericChildSectionIds={draft.template?.capabilities.sections.filter(({ elements }) => elements?.allowedTypes.includes("text")).map(({ id }) => id) ?? []}
      pending={listPending}
      onSelect={selectSection}
      onNarrativeBlockSelect={selectNarrativeBlock}
      onStoryHeaderSelect={selectStoryHeader}
      onStoryChange={(sectionId, content) => {
        if (sectionId === effectiveSelectedId) {
          updateWorkingContent(content);
          return true;
        }
        if (sectionDirty) {
          setPendingSelection(sectionId);
          return false;
        }
        setSelectedId(sectionId);
        setContentOverride({ sectionId, content });
        setAppearanceOverride(null);
        setInlineEditingTarget(null);
        return true;
      }}
      onChildSelect={(sectionId, reference) => selectChild(sectionId, reference, true)}
      onChildFlowChange={changeChildFlow}
      onToggle={toggle}
      onMove={move}
      onReorder={reorderSections}
    />
  );
  const desktopInspector =
    mode === "design" && draft.template ? (
      <DesignPanel
        settings={designSettings}
        capability={globalDesignCapability(draft.template.capabilities)}
        library={draft.template.capabilities.designLibrary}
        error={designError}
        eventName={event.name}
        templateKey={draft.templateKey}
        onChange={setDesignOverride}
      />
    ) : (
      <SectionInspector
        eventId={event.id}
        templateKey={draft.templateKey}
        capabilities={draft.template?.capabilities}
        resolvedMedia={previewDraft.media}
        onMediaResolved={(media) =>
          setMediaOverrides((current) => ({ ...current, [media.id]: media }))
        }
        selected={selected}
        workingContent={workingContent}
        workingAppearance={workingAppearance}
        targetViewport={previewMode}
        selectedNarrativeBlockId={selectedNarrativeBlockId}
        selectedChild={selectedChild && selectedChild.sectionId === selected?.id ? selectedChild.reference : null}
        narrativeContentDisclosure={narrativeContentDisclosure}
        narrativeAppearanceDisclosure={narrativeAppearanceDisclosure}
        storyHeaderFocus={storyHeaderSelection?.sectionId === selected?.id ? storyHeaderSelection : null}
        panelMode={sectionPanelMode}
        showModeSwitch
        appearanceDirty={appearanceDirty}
        appearanceError={appearanceError}
        sectionDesignSaving={sectionDesignSaving}
        sectionDesignError={sectionDesignError}
        onPanelModeChange={(next) => applyDrawerMode(next)}
        onNarrativeContentDisclosureChange={(slot) => openNarrativeSlotFromInspector(slot)}
        onNarrativeAppearanceDisclosureChange={(slot) => openNarrativeSlotFromInspector(slot, true)}
        projectColors={designSettings.customColors}
        onAddColor={addProjectColor}
        onContentChange={updateWorkingContent}
        onAppearanceChange={(appearance) =>
          selected &&
          setAppearanceOverride({ sectionId: selected.id, appearance })
        }
        onSectionDesignChange={(defaults) =>
          void saveSectionDesignDefaults(defaults)
        }
      />
    );
  const mobileDrawerPanel =
    drawerMode === "sections" ? (
      <div className="h-full overflow-y-auto overscroll-contain" data-structure-scroll-container>
        {sectionRail}
      </div>
    ) : drawerMode === "design" && draft.template ? (
      <DesignPanel
        settings={designSettings}
        capability={globalDesignCapability(draft.template.capabilities)}
        library={draft.template.capabilities.designLibrary}
        error={designError}
        eventName={event.name}
        templateKey={draft.templateKey}
        onChange={setDesignOverride}
      />
    ) : (
      <SectionInspector
        eventId={event.id}
        templateKey={draft.templateKey}
        capabilities={draft.template?.capabilities}
        resolvedMedia={previewDraft.media}
        onMediaResolved={(media) =>
          setMediaOverrides((current) => ({ ...current, [media.id]: media }))
        }
        selected={selected}
        workingContent={workingContent}
        workingAppearance={workingAppearance}
        targetViewport={previewMode}
        selectedNarrativeBlockId={selectedNarrativeBlockId}
        selectedChild={selectedChild && selectedChild.sectionId === selected?.id ? selectedChild.reference : null}
        narrativeContentDisclosure={narrativeContentDisclosure}
        narrativeAppearanceDisclosure={narrativeAppearanceDisclosure}
        storyHeaderFocus={storyHeaderSelection?.sectionId === selected?.id ? storyHeaderSelection : null}
        panelMode={drawerMode === "appearance" ? "appearance" : "content"}
        showModeSwitch={false}
        appearanceDirty={appearanceDirty}
        appearanceError={appearanceError}
        sectionDesignSaving={sectionDesignSaving}
        sectionDesignError={sectionDesignError}
        onPanelModeChange={(next) => applyDrawerMode(next)}
        onNarrativeContentDisclosureChange={(slot) => openNarrativeSlotFromInspector(slot)}
        onNarrativeAppearanceDisclosureChange={(slot) => openNarrativeSlotFromInspector(slot, true)}
        projectColors={designSettings.customColors}
        onAddColor={addProjectColor}
        onContentChange={updateWorkingContent}
        onAppearanceChange={(appearance) =>
          selected &&
          setAppearanceOverride({ sectionId: selected.id, appearance })
        }
        onSectionDesignChange={(defaults) =>
          void saveSectionDesignDefaults(defaults)
        }
      />
    );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="z-20 flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
        <Link
          className="mr-1 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground"
          to={`/events/${event.id}`}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to Event
        </Link>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div
          className="mr-auto flex min-w-0 items-center gap-2 px-2"
          aria-label={`Template: ${draft.template?.displayName ?? draft.templateKey}`}
        >
          <LayoutTemplate size={16} className="shrink-0 text-accent" />
          <span className="hidden text-xs text-foreground-muted sm:inline">
            Template
          </span>
          <span className="truncate text-sm font-semibold">
            {draft.template?.displayName ?? draft.templateKey}
          </span>
        </div>
        <SegmentedControl
          value={editorMode}
          options={[
            { value: "edit", label: "Edit" },
            { value: "preview", label: "Preview" },
          ]}
          label="Editor mode"
          onChange={changeEditorMode}
        />
        <Link
          className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
          to={`/events/${event.id}/websites/${projectId}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          title={
            globalDirty
              ? "Shows the last saved draft. Unsaved builder changes are not included."
              : "Preview the saved Website on this device"
          }
          aria-label={
            globalDirty
              ? "Preview saved Website draft in a new tab. Unsaved changes are not included."
              : "Preview Website in a new tab"
          }
        >
          <ExternalLink aria-hidden="true" size={15} />
          <span>
            {globalDirty
              ? "Preview saved draft"
              : "Preview Website"}
          </span>
        </Link>
        <div className="hidden xl:block">
          <SegmentedControl
            value={mode}
            options={[
              { value: "content", label: "Content" },
              { value: "design", label: "Design" },
            ]}
            label="Builder mode"
            onChange={changeMode}
          />
        </div>
        {accessibleViewports.length > 1 && (
          <div>
            <SegmentedControl
              value={previewMode}
              options={accessibleViewports.map((viewport) => ({
                value: viewport,
                label: viewport[0].toUpperCase() + viewport.slice(1),
                icon:
                  viewport === "desktop" ? (
                    <Monitor size={14} />
                  ) : viewport === "tablet" ? (
                    <Tablet size={14} />
                  ) : (
                    <Smartphone size={14} />
                  ),
              }))}
              label="Preview and editing viewport"
              onChange={setPreviewMode}
            />
          </div>
        )}
      </header>

      {contentError && (
        <p
          className="shrink-0 border-b border-border bg-danger-muted px-4 py-2 text-sm text-danger"
          role="alert"
        >
          {contentError}
        </p>
      )}
      <BuilderSaveBar
        dirty={globalDirty}
        resetDirty={globalDirty}
        saving={listPending}
        onSave={() => void saveEditorChanges()}
        onReset={resetEditorChanges}
      />

      {listError && (
        <p
          className="shrink-0 border-b border-border bg-danger-muted px-4 py-2 text-sm text-danger"
          role="alert"
        >
          {listError}
        </p>
      )}
      {workingSections.length === 0 ? (
        <EmptyEditor />
      ) : (
        <div className="flex h-0 min-h-0 flex-1 overflow-hidden xl:grid xl:grid-cols-[240px_minmax(0,1fr)_390px] xl:grid-rows-[minmax(0,1fr)]">
          <aside
            className="hidden min-h-0 overflow-y-auto border-r border-border bg-background p-3 xl:block"
            aria-label="Builder Section rail"
            data-structure-scroll-container
          >
            {sectionRail}
          </aside>
          <PreviewCanvas
            event={event}
            draft={previewDraft}
            mode={mode}
            editorMode={editorMode}
            selectedId={effectiveSelectedId}
            previewMode={previewMode}
            unsaved={globalDirty}
            inlineValue={
              mode === "content"
                ? {
                    activeTarget: inlineEditingTarget,
                    requestEdit: requestInlineEdit,
                    updateValue: updateInlineValue,
                    finishEdit: () => setInlineEditingTarget(null),
                  }
                : null
            }
            selectedNarrativeBlockId={selectedNarrativeBlockId}
            selectedChild={selectedChild?.sectionId === effectiveSelectedId ? selectedChild.reference : null}
            activeNarrativeSlot={activeNarrativeSlot}
            selectedStoryHeaderField={storyHeaderSelection?.sectionId === effectiveSelectedId ? storyHeaderSelection.field : null}
            selectionRequest={canvasSelectionRequest}
            onNarrativeBlockSelect={selectNarrativeBlock}
            onChildSelect={selectChild}
            onChildFlowChange={changeChildFlow}
            onNarrativeSlotSelect={selectNarrativeSlot}
            onSectionSelect={selectSection}
          />
          <aside
            className="hidden h-full min-h-0 overflow-hidden border-l border-border bg-background p-3 xl:block"
            aria-label="Builder inspector"
          >
            {desktopInspector}
          </aside>

          <MobileBuilderDrawer
            snap={drawerSnap}
            mode={drawerMode}
            contextLabel={
              drawerMode === "sections"
                ? "Sections"
                : drawerMode === "design"
                  ? "Website · Design"
                  : `${selected?.type === "story" && storyHeaderSelection?.sectionId === selected.id ? storyHeaderSelection.field === "eyebrow" ? "Eyebrow" : storyHeaderSelection.field === "heading" ? "Heading" : "Intro" : selected?.displayName ?? "Section"} · ${drawerMode === "appearance" ? "Appearance" : "Content"}`
            }
            onSnapChange={setDrawerSnap}
            onModeChange={changeDrawerMode}
          >
            {mobileDrawerPanel}
          </MobileBuilderDrawer>
        </div>
      )}

      <DiscardChangesDialog
        open={pendingSelection !== null || pendingMode !== null}
        onCancel={() => {
          setPendingSelection(null);
          setPendingMode(null);
          setPendingDrawerMode(null);
          setPendingStoryHeaderSelection(null);
          setPendingChildSelection(null);
        }}
        onDiscard={() => {
          if (pendingSelection) setSelectedId(pendingSelection);
          if (pendingMode) setMode(pendingMode);
          if (pendingDrawerMode) applyDrawerMode(pendingDrawerMode);
          if (pendingSelection || pendingMode) {
            setInlineEditingTarget(null);
            setSelectedNarrativeBlockId(null);
            setStoryHeaderSelection(null);
          }
          if (pendingStoryHeaderSelection) setStoryHeaderSelection(pendingStoryHeaderSelection);
          if (pendingChildSelection) {
            setSelectedChild({ sectionId: pendingChildSelection.sectionId, reference: pendingChildSelection.reference });
            const pendingSection = workingSections.find(({ id }) => id === pendingChildSelection.sectionId);
            const pendingFlow = (pendingSection?.content as { childFlow?: SectionChildFlow } | undefined)?.childFlow;
            const pendingElement = pendingChildSelection.reference.kind === "element" ? findSectionElement(pendingFlow, pendingChildSelection.reference.id) : undefined;
            if (pendingChildSelection.requestCanvasScroll && pendingElement && !pendingElement.isHidden) {
              setCanvasSelectionRequest({ kind: "element", id: pendingElement.id, sectionId: pendingChildSelection.sectionId, requestId: ++canvasSelectionRequestId.current });
            }
          }
          setPendingSelection(null);
          setPendingMode(null);
          setPendingDrawerMode(null);
          setPendingStoryHeaderSelection(null);
          setPendingChildSelection(null);
          setContentOverride(null);
          setAppearanceOverride(null);
          setDesignOverride(null);
          setSectionStructureOverride(null);
          setAppearanceError(null);
          setContentError(null);
          setDesignError(null);
          setListError(null);
        }}
      />
    </div>
  );
}

function MobileBuilderDrawer({
  snap,
  mode,
  contextLabel,
  children,
  onSnapChange,
  onModeChange,
}: {
  snap: MobileDrawerSnap;
  mode: DrawerMode;
  contextLabel: string;
  children: React.ReactNode;
  onSnapChange: (snap: MobileDrawerSnap) => void;
  onModeChange: (mode: DrawerMode) => void;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
    currentY: number;
    moved: boolean;
  } | null>(null);
  const suppressTapRef = useRef(false);
  const isHidden = snap === "hidden";
  const height =
    snap === "hidden"
      ? "h-[calc(4rem+env(safe-area-inset-bottom))]"
      : snap === "tall"
        ? "h-[84dvh]"
        : "h-[50dvh]";
  const tabs: Array<[DrawerMode, string]> = [
    ["sections", "Sections"],
    ["content", "Content"],
    ["appearance", "Appearance"],
    ["design", "Design"],
  ];
  const snapOrder: MobileDrawerSnap[] = ["hidden", "medium", "tall"];

  function snapHeight(target: MobileDrawerSnap) {
    if (target === "hidden") return 64;
    return window.innerHeight * (target === "medium" ? 0.5 : 0.84);
  }

  function moveOne(direction: -1 | 1) {
    const nextIndex = Math.max(
      0,
      Math.min(snapOrder.length - 1, snapOrder.indexOf(snap) + direction),
    );
    onSnapChange(snapOrder[nextIndex]);
  }

  function handleHeaderTap() {
    if (suppressTapRef.current) {
      suppressTapRef.current = false;
      return;
    }
    onSnapChange(
      snap === "hidden" ? "medium" : snap === "medium" ? "tall" : "medium",
    );
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!drawerRef.current || event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      currentY: event.clientY,
      startHeight: drawerRef.current.getBoundingClientRect().height,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !drawerRef.current)
      return;
    drag.currentY = event.clientY;
    const delta = drag.startY - event.clientY;
    if (!drag.moved && Math.abs(delta) < 10) return;
    drag.moved = true;
    event.preventDefault();
    suppressTapRef.current = true;
    const nextHeight = Math.max(
      snapHeight("hidden"),
      Math.min(snapHeight("tall"), drag.startHeight + delta),
    );
    drawerRef.current.style.transition = "none";
    drawerRef.current.style.height = `${nextHeight}px`;
  }

  function finishPointer(
    event: React.PointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !drawerRef.current)
      return;
    dragRef.current = null;
    const delta = drag.startY - drag.currentY;
    let nextSnap = snap;
    if (!cancelled && drag.moved && Math.abs(delta) >= 10) {
      const finalHeight = Math.max(
        snapHeight("hidden"),
        Math.min(snapHeight("tall"), drag.startHeight + delta),
      );
      const nearest = snapOrder.reduce(
        (closest, candidate) =>
          Math.abs(snapHeight(candidate) - finalHeight) <
          Math.abs(snapHeight(closest) - finalHeight)
            ? candidate
            : closest,
        snap,
      );
      nextSnap =
        nearest === snap
          ? snapOrder[
              Math.max(
                0,
                Math.min(
                  snapOrder.length - 1,
                  snapOrder.indexOf(snap) + (delta > 0 ? 1 : -1),
                ),
              )
            ]
          : nearest;
    }
    drawerRef.current.style.removeProperty("transition");
    drawerRef.current.style.removeProperty("height");
    onSnapChange(nextSnap);
  }

  return (
    <aside
      ref={drawerRef}
      className={`fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-background shadow-[0_-12px_32px_rgb(24_18_15/12%)] transition-[height] duration-200 motion-reduce:transition-none xl:hidden ${height}`}
      aria-label={`Mobile Website builder controls, ${snap} height`}
    >
      <div
        className={`relative shrink-0 bg-surface px-3 pt-2 ${isHidden ? "" : "border-b border-border"}`}
      >
        <span
          className="pointer-events-none absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-border"
          aria-hidden="true"
        />
        <div className="flex items-center gap-1">
          <button
            className="flex min-h-12 min-w-0 flex-1 touch-none flex-col items-start justify-center gap-1 rounded-lg px-2 text-left hover:bg-surface-muted"
            type="button"
            aria-expanded={!isHidden}
            onClick={handleHeaderTap}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={(event) => finishPointer(event, true)}
          >
            <span className="h-1 w-10 opacity-0" aria-hidden="true" />
            <span className="w-full truncate text-sm font-semibold">
              {contextLabel}
            </span>
          </button>
          <button
            className="grid size-10 shrink-0 place-items-center rounded-lg text-foreground-muted hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            type="button"
            disabled={snap === "tall"}
            onClick={() => moveOne(1)}
            aria-label="Increase drawer height"
          >
            <ChevronUp size={18} aria-hidden="true" />
          </button>
          <button
            className="grid size-10 shrink-0 place-items-center rounded-lg text-foreground-muted hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            type="button"
            disabled={snap === "hidden"}
            onClick={() => moveOne(-1)}
            aria-label="Decrease drawer height"
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>
        {!isHidden && (
          <>
            <div
              className="grid grid-cols-4 gap-1 py-2"
              role="tablist"
              aria-label="Builder panels"
            >
              {tabs.map(([key, label]) => (
                <button
                  className={`min-h-9 rounded-lg px-1 text-[11px] font-medium sm:text-xs ${mode === key ? "bg-accent text-accent-foreground" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"}`}
                  id={`builder-drawer-tab-${key}`}
                  key={key}
                  type="button"
                  role="tab"
                  aria-controls="builder-drawer-panel"
                  aria-selected={mode === key}
                  onClick={() => onModeChange(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {!isHidden && (
        <div
          className="min-h-0 flex-1 overflow-hidden px-3 pt-3"
          id="builder-drawer-panel"
          role="tabpanel"
          aria-labelledby={`builder-drawer-tab-${mode}`}
          style={
            mode === "sections"
              ? { paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }
              : undefined
          }
        >
          <div className="mx-auto h-full min-h-0 max-w-2xl overflow-hidden">{children}</div>
        </div>
      )}
    </aside>
  );
}

function PreviewCanvas({
  event,
  draft,
  mode,
  editorMode,
  selectedId,
  previewMode,
  unsaved,
  inlineValue,
  selectedNarrativeBlockId,
  selectedChild,
  activeNarrativeSlot,
  selectedStoryHeaderField,
  selectionRequest,
  onNarrativeBlockSelect,
  onChildSelect,
  onChildFlowChange,
  onNarrativeSlotSelect,
  onSectionSelect,
}: {
  event: ReturnType<typeof useEventWorkspace>;
  draft: WebsiteDraft;
  mode: BuilderMode;
  editorMode: EditorMode;
  selectedId: string | null;
  previewMode: ResponsiveViewport;
  unsaved: boolean;
  inlineValue: React.ComponentProps<typeof InlineEditProvider>["value"];
  selectedNarrativeBlockId: string | null;
  selectedChild: SectionChildReference | null;
  activeNarrativeSlot: { blockId: string; slot: NarrativeSlotKey } | null;
  selectedStoryHeaderField: StoryHeaderField | null;
  selectionRequest: CanvasSelectionRequest | null;
  onNarrativeBlockSelect: (blockId: string) => void;
  onChildSelect: (sectionId: string, reference: SectionChildReference) => void;
  onChildFlowChange: (sectionId: string, flow: SectionChildFlow | undefined, selection?: SectionChildReference) => boolean;
  onNarrativeSlotSelect: (blockId: string, slot: NarrativeSlotKey) => void;
  onSectionSelect: (id: string) => void;
}) {
  useLayoutEffect(() => {
    if (editorMode !== "edit" || !selectionRequest) return;
    const selector =
      selectionRequest.kind === "section"
        ? `[data-preview-section="${CSS.escape(selectionRequest.id)}"]`
        : selectionRequest.kind === "storyField"
          ? `[data-editor-story-field="${CSS.escape(selectionRequest.id)}"]`
          : selectionRequest.kind === "element"
            ? `[data-editor-website-element="${CSS.escape(selectionRequest.id)}"]`
          : selectionRequest.kind === "narrativeSlot"
            ? `[data-editor-narrative-block="${CSS.escape(selectionRequest.id)}"] [data-editor-narrative-slot="${CSS.escape(selectionRequest.slot)}"]`
            : `[data-editor-narrative-block="${CSS.escape(selectionRequest.id)}"]`;
    const documents = [
      document,
      ...Array.from(document.querySelectorAll("iframe")).flatMap(
        (frame) => (frame.contentDocument ? [frame.contentDocument] : []),
      ),
    ];
    let target = findEditorTarget(documents, selector);
        if (!target && selectionRequest.kind === "storyField") {
          const storySelector = `[data-preview-section="${CSS.escape(selectionRequest.sectionId)}"] [data-section-content]`;
          target = findEditorTarget(documents, storySelector);
        }
        if (!target && selectionRequest.kind === "narrativeSlot") {
          const blockSelector = `[data-editor-narrative-block="${CSS.escape(selectionRequest.id)}"]`;
          target = findEditorTarget(documents, blockSelector);
        }
        if (!target) return;
    revealEditorTarget(target);
  }, [editorMode, selectionRequest]);

  return (
    <main
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-muted p-2 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:p-3 sm:pb-[calc(4rem+env(safe-area-inset-bottom))] xl:pb-3"
      aria-label="Live Website preview"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-1 pb-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
            {editorMode === "edit" ? "Live editor" : "Website preview"}
          </p>
          <p className="text-[11px] text-foreground-muted">
            {editorMode === "edit"
              ? "Changes appear before saving."
              : "All enabled sections · non-editable"}
          </p>
        </div>
        {unsaved && (
          <span className="rounded-full bg-danger-muted px-2 py-1 text-[10px] font-medium text-danger">
            Unsaved preview
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto rounded-xl bg-background/45 p-2">
        <PreviewViewport viewport={previewMode}>
          <InlineEditProvider
            value={editorMode === "edit" ? inlineValue : null}
          >
            <EditorSelectionContext.Provider value={editorMode === "edit" ? selectedStoryHeaderField : null}>
            <NarrativeSlotFocusContext.Provider value={{ active: activeNarrativeSlot, onSelect: onNarrativeSlotSelect }}>
            <WebsiteRenderer
              event={event}
              website={draft}
              mode={editorMode === "edit" ? "editor" : "public"}
              selectedSectionId={
                editorMode === "edit" && mode === "content" ? selectedId : null
              }
              onSectionSelect={
                editorMode === "edit" ? onSectionSelect : undefined
              }
              selectedNarrativeBlockId={
                editorMode === "edit" ? selectedNarrativeBlockId : null
              }
              onNarrativeBlockSelect={
                editorMode === "edit" ? onNarrativeBlockSelect : undefined
              }
              selectedElementId={
                editorMode === "edit" && selectedChild?.kind === "element" ? selectedChild.id : null
              }
              onElementSelect={
                editorMode === "edit" ? (sectionId, elementId) => onChildSelect(sectionId, { kind: "element", id: elementId }) : undefined
              }
              onElementEdit={
                editorMode === "edit"
                  ? (sectionId, elementId) => inlineValue?.requestEdit({
                      sectionId,
                      elementId,
                      path: ["childFlow", "elements"],
                      label: "Text",
                    })
                  : undefined
              }
              onElementChange={
                editorMode === "edit"
                  ? (sectionId: string, element: WebsiteElement) => {
                      const section = draft.sections.find(({ id }) => id === sectionId);
                      const flow = (section?.content as { childFlow?: SectionChildFlow } | undefined)?.childFlow;
                      if (flow) onChildFlowChange(sectionId, updateSectionElement(flow, element), { kind: "element", id: element.id });
                    }
                  : undefined
              }
              targetViewport={previewMode}
              scope={
                editorMode === "edit" && selectedId
                  ? { kind: "single-section", sectionId: selectedId }
                  : { kind: "full" }
              }
            />
            </NarrativeSlotFocusContext.Provider>
            </EditorSelectionContext.Provider>
          </InlineEditProvider>
        </PreviewViewport>
      </div>
    </main>
  );
}

function PreviewViewport({
  viewport,
  children,
}: {
  viewport: ResponsiveViewport;
  children: React.ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const target = frameRef.current?.contentDocument?.documentElement;
    if (!mount || !target) return;
    const sync = () => syncEditorPreviewTheme(document.documentElement, target);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, [mount]);

  if (viewport === "desktop")
    return (
      <div data-editor-preview-scroll className="mx-auto h-full min-h-0 w-[1280px] max-w-none shrink-0 overflow-y-auto rounded-lg bg-white shadow-[0_16px_50px_rgb(35_24_18/16%)]">
        {children}
      </div>
    );

  return (
    <div
      className="mx-auto h-full max-w-full overflow-hidden rounded-lg bg-white shadow-[0_16px_50px_rgb(35_24_18/16%)]"
      style={{ width: PREVIEW_WIDTHS[viewport] }}
    >
      <iframe
        ref={frameRef}
        className="h-full w-full border-0"
        title={`${viewport[0].toUpperCase() + viewport.slice(1)} Website preview`}
        srcDoc="<!doctype html><html><head></head><body><div id='responsive-preview-root'></div></body></html>"
        onLoad={(event) => {
          const documentTarget = event.currentTarget.contentDocument;
          if (!documentTarget) return;
          document
            .querySelectorAll('style, link[rel="stylesheet"]:not([data-font-preview])')
            .forEach((node) =>
              documentTarget.head.appendChild(node.cloneNode(true)),
            );
          syncEditorPreviewTheme(document.documentElement, documentTarget.documentElement);
          documentTarget.body.style.margin = "0";
          const root = documentTarget.getElementById("responsive-preview-root");
          if (root) setMount(root);
        }}
      />
      {mount && createPortal(children, mount)}
    </div>
  );
}

function SectionInspector({
  eventId,
  templateKey,
  capabilities,
  resolvedMedia,
  onMediaResolved,
  selected,
  workingContent,
  workingAppearance,
  targetViewport,
  selectedNarrativeBlockId,
  selectedChild,
  narrativeContentDisclosure,
  narrativeAppearanceDisclosure,
  storyHeaderFocus,
  panelMode,
  showModeSwitch,
  appearanceDirty,
  appearanceError,
  sectionDesignSaving,
  sectionDesignError,
  onPanelModeChange,
  onNarrativeContentDisclosureChange,
  onNarrativeAppearanceDisclosureChange,
  projectColors,
  onAddColor,
  onContentChange,
  onAppearanceChange,
  onSectionDesignChange,
}: {
  eventId: string;
  templateKey: string;
  capabilities?: TemplateCapabilities;
  resolvedMedia: WebsiteDraft["media"];
  onMediaResolved: (media: WebsiteDraft["media"][string]) => void;
  selected: WebsiteSection | null;
  workingContent?: Record<string, unknown>;
  workingAppearance?: WebsiteSectionAppearance;
  targetViewport: ResponsiveViewport;
  selectedNarrativeBlockId: string | null;
  selectedChild: SectionChildReference | null;
  narrativeContentDisclosure: NarrativeSlotKey | null;
  narrativeAppearanceDisclosure: NarrativeTypographySlotKey | null;
  storyHeaderFocus: { field: StoryHeaderField; requestId: number; focusInspector: boolean } | null;
  panelMode: SectionPanelMode;
  showModeSwitch: boolean;
  appearanceDirty: boolean;
  appearanceError: string | null;
  sectionDesignSaving: boolean;
  sectionDesignError: string | null;
  onPanelModeChange: (mode: SectionPanelMode) => void;
  onNarrativeContentDisclosureChange: (slot: NarrativeSlotKey | null) => void;
  onNarrativeAppearanceDisclosureChange: (slot: NarrativeTypographySlotKey | null) => void;
  projectColors: ProjectColor[];
  onAddColor: (value: string) => Promise<ProjectColor>;
  onContentChange: (content: Record<string, unknown>) => void;
  onAppearanceChange: (appearance: WebsiteSectionAppearance) => void;
  onSectionDesignChange: (defaults: SectionDesignDefaults) => void;
}) {
  if (!selected || !workingContent || !workingAppearance) return null;
  const capability = capabilities
    ? sectionCapability(capabilities, selected.type)
    : undefined;
  const narrativeElements =
    selected.type === "story"
      ? (workingContent.elements as
          import("../../features/websiteEditor/types").StoryBlock[] | undefined)
      : undefined;
  const narrativeIndex = selectedNarrativeBlockId
    ? (narrativeElements?.findIndex(({ id }) => id === selectedNarrativeBlockId) ?? -1)
    : -1;
  const narrativeBlock =
    narrativeIndex >= 0 ? (narrativeElements?.[narrativeIndex] ?? null) : null;
  const childFlow = (workingContent as { childFlow?: SectionChildFlow }).childFlow;
  const selectedElement = selectedChild?.kind === "element" ? findSectionElement(childFlow, selectedChild.id) : undefined;
  const selectedText = selectedElement?.type === "text" ? selectedElement : null;
  const selectedRichText = selectedElement?.type === "richText" ? selectedElement : null;
  const selectedGroup = selectedElement?.type === "compositionGroup" ? selectedElement : null;
  const selectedDivider = selectedElement?.type === "divider" ? selectedElement : null;
  const selectedMedia = selectedElement?.type === "media" ? selectedElement : null;
  const narrativeCapability = capabilities
    ? templateElementCapability(capabilities, "narrativeBlock")
    : undefined;
  const textCapability = capabilities
    ? templateElementCapability(capabilities, "text")
    : undefined;
  const textFontIds = textCapability?.appearance?.typography.find(({ role }) => role === "body")?.allowedFontIds ?? [];
  const textColorIds = textCapability?.appearance?.colors.find(({ role }) => role === "textColor")?.allowedColorIds ?? [];
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="hidden shrink-0 border-b border-border xl:mb-4 xl:block xl:px-0 xl:pb-3 xl:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heading className="xl:text-base!" level={2} variant="panel">
              {selectedRichText ? "Rich Text" : selectedText ? "Text" : selectedGroup ? "Group" : selectedDivider ? "Divider" : selectedMedia ? "Media" : narrativeBlock ? "Narrative Block" : selected.type === "story" && storyHeaderFocus ? storyHeaderFocus.field === "eyebrow" ? "Eyebrow" : storyHeaderFocus.field === "heading" ? "Heading" : "Intro" : selected.displayName}
            </Heading>
            {!selected.isEnabled && (
              <span className="rounded-full bg-surface-muted px-2 py-1 text-[10px] text-foreground-muted">
                Hidden
              </span>
            )}
          </div>
          {showModeSwitch && !selectedRichText && !selectedText && !selectedGroup && !selectedDivider && (
            <SegmentedControl
              value={panelMode}
              options={[
                { value: "content", label: "Content" },
                { value: "appearance", label: "Appearance" },
              ]}
              label="Section editor mode"
              onChange={onPanelModeChange}
            />
          )}
        </div>
        {!(panelMode === "content" && selected.type === "story" && storyHeaderFocus) && <Text className="mt-2 xl:mt-1" variant="helper">
          {selectedRichText || selectedText
            ? "Edit content directly on the canvas. Customize this element’s appearance here."
            : selectedGroup ? "Arrange this Group’s children and responsive layout." 
            : panelMode === "content"
            ? narrativeBlock
              ? "Edit this Narrative Block’s canonical content and visibility."
              : "Edit semantic content."
            : "Customize this Section’s presentation."}
        </Text>}
      </div>
      {selectedRichText && childFlow && capabilities ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-6 xl:px-0"><RichTextElementEditor element={selectedRichText} viewport={targetViewport} library={capabilities.designLibrary} allowedFontIds={textFontIds} allowedColorIds={textColorIds} projectColors={projectColors} context={selected.resolvedDesignContext} onAddColor={onAddColor} onAppearanceChange={(appearance) => { const next = updateSectionRichTextAppearance(childFlow, selectedRichText.id, appearance); if (next) onContentChange({ ...workingContent, childFlow: next }); }} /></div>
      ) : selectedText && childFlow && capabilities ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-6 xl:px-0"><TextElementEditor element={selectedText} viewport={targetViewport} templateKey={templateKey} library={capabilities.designLibrary} allowedFontIds={textFontIds} allowedColorIds={textColorIds} projectColors={projectColors} context={selected.resolvedDesignContext} onAddColor={onAddColor} onChange={(element) => onContentChange({ ...workingContent, childFlow: updateSectionElement(childFlow, element) })} /></div>
      ) : selectedDivider && childFlow && capabilities ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-6 xl:px-0"><DividerElementEditor element={selectedDivider} templateKey={templateKey} library={capabilities.designLibrary} allowedColorIds={textColorIds} projectColors={projectColors} onAddColor={onAddColor} onChange={(element) => onContentChange({ ...workingContent, childFlow: updateSectionElement(childFlow, element) })} /></div>
      ) : selectedMedia && childFlow ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-6 xl:px-0"><MediaElementEditor element={selectedMedia} eventId={eventId} viewport={targetViewport} mode={panelMode} resolvedMedia={resolvedMedia} onMediaResolved={onMediaResolved} onChange={(element) => onContentChange({ ...workingContent, childFlow: updateSectionElement(childFlow, element) })} /></div>
      ) : selectedGroup && childFlow ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-6 xl:px-0"><GroupElementEditor group={selectedGroup} viewport={targetViewport} templateKey={templateKey} capability={narrativeCapability?.narrativeBlock ?? undefined} library={capabilities?.designLibrary} projectColors={projectColors} onAddColor={onAddColor} onChange={(group) => onContentChange({ ...workingContent, childFlow: updateSectionElement(childFlow, group) })} onUngroup={() => { const next = ungroupSectionElement(childFlow, selectedGroup.id); onContentChange({ ...workingContent, childFlow: next }); }} /></div>
      ) : panelMode === "content" ? (
        narrativeBlock && selected.type === "story" ? (
          <NarrativeBlockContentPanel
            block={narrativeBlock}
            content={
              workingContent as import("../../features/websiteEditor/types").StoryContent
            }
            resolvedMedia={resolvedMedia}
            onMediaResolved={onMediaResolved}
            activeDisclosure={narrativeContentDisclosure}
            onDisclosureChange={onNarrativeContentDisclosureChange}
            onChange={onContentChange}
          />
        ) : (
          <div className="min-h-0 flex-1">
            <SectionEditor
              key={`${selected.id}:${storyHeaderFocus?.requestId ?? 0}`}
              section={selected}
              content={workingContent}
              onChange={onContentChange}
              resolvedMedia={resolvedMedia}
              onMediaResolved={onMediaResolved}
              storyHeaderFocus={storyHeaderFocus}
            />
          </div>
        )
      ) : capability ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-6 xl:px-0">
            {narrativeBlock && narrativeCapability && capabilities ? (
              <NarrativeBlockAppearancePanel
                block={narrativeBlock}
                templateKey={templateKey}
                viewport={targetViewport}
                capability={narrativeCapability}
                library={capabilities.designLibrary}
                projectColors={projectColors}
                context={selected.resolvedDesignContext}
                activeDisclosure={narrativeAppearanceDisclosure}
                onDisclosureChange={onNarrativeAppearanceDisclosureChange}
                onAddColor={onAddColor}
                onChange={(block) => {
                  const next = structuredClone(workingContent);
                  next.elements = (
                    next.elements as import("../../features/websiteEditor/types").StoryBlock[]
                  ).map((element) =>
                    element.id === block.id ? block : element,
                  );
                  onContentChange(next);
                }}
              />
            ) : selected.type === "story" && storyHeaderFocus && narrativeCapability && capabilities ? (
              <StorySingletonAppearancePanel field={storyHeaderFocus.field} content={workingContent as import("../../features/websiteEditor/types").StoryContent} sectionAppearance={resolveSectionAppearanceForViewport(workingAppearance, targetViewport, capability)} viewport={targetViewport} capability={narrativeCapability} library={capabilities.designLibrary} projectColors={projectColors} context={selected.resolvedDesignContext} onAddColor={onAddColor} onChange={onContentChange} />
            ) : (
              <>
                <AppearancePanel
                  key={`${selected.id}:${storyHeaderFocus?.requestId ?? 0}`}
                  appearance={workingAppearance}
                  templateKey={templateKey}
                  sectionCapability={capability}
                  targetViewport={targetViewport}
                  error={appearanceError}
                  library={capabilities!.designLibrary}
                  projectColors={projectColors}
                  onAddColor={onAddColor}
                  onChange={onAppearanceChange}
                />
                {selected.type !== "story" && <SectionDesignDefaultsPanel
                  appearance={workingAppearance}
                  capability={capability}
                  defaults={selected.designDefaults}
                  resolved={selected.resolvedDesignContext}
                  library={capabilities!.designLibrary}
                  saving={sectionDesignSaving}
                  disabled={appearanceDirty}
                  error={sectionDesignError}
                  onChange={onSectionDesignChange}
                />}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-1 xl:px-0">
          <p className="rounded-xl bg-surface-muted p-4 text-sm text-foreground-muted">
            This Template does not support appearance controls for this Section.
          </p>
        </div>
      )}
    </section>
  );
}

function EditorLoading({ eventId }: { eventId: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <Link
          className="flex items-center gap-2 text-sm text-foreground-muted"
          to={`/events/${eventId}`}
        >
          <ArrowLeft size={16} /> Back to Event
        </Link>
        <div className="h-8 w-52 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="grid min-h-0 flex-1 animate-pulse xl:grid-cols-[240px_1fr_390px]">
        <div className="hidden border-r border-border bg-surface-muted xl:block" />
        <div className="m-3 rounded-xl bg-surface-muted" />
        <div className="hidden border-l border-border bg-surface-muted xl:block" />
      </div>
    </div>
  );
}
function EditorError({
  eventId,
  message,
  retry,
}: {
  eventId: string;
  message: string;
  retry: () => void;
}) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
        <FileWarning className="mx-auto text-danger" />
        <h1 className="mt-3 font-semibold">
          Unable to load the Website builder
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">{message}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm"
            to={`/events/${eventId}`}
          >
            <ArrowLeft size={15} /> Back to Event
          </Link>
          <button
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground"
            type="button"
            onClick={retry}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    </div>
  );
}
function EmptyEditor() {
  return (
    <div className="grid min-h-0 flex-1 place-items-center p-6">
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <FileWarning className="mx-auto text-secondary-accent" />
        <h2 className="mt-3 font-semibold">No Website sections found</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          The draft exists, but it does not currently contain editable sections.
        </p>
      </div>
    </div>
  );
}

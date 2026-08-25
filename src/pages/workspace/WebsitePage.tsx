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
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { Heading } from "../../components/ui/Heading";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Text } from "../../components/ui/Text";
import { useEventWorkspace } from "../../features/events/workspace/EventWorkspaceContext";
import {
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
import { SectionDesignDefaultsPanel } from "../../features/websiteEditor/components/SectionDesignDefaultsPanel";
import { SectionNavigator } from "../../features/websiteEditor/components/SectionNavigator";
import { InlineEditProvider } from "../../features/websiteEditor/inline/InlineEditContext";
import type {
  InlineFieldPath,
  InlineEditingTarget,
} from "../../features/websiteEditor/inline/types";
import type {
  ResponsiveViewport,
  WebsiteDesignSettings,
  WebsiteDraft,
  SectionDesignDefaults,
  WebsiteSection,
  WebsiteSectionAppearance,
} from "../../features/websiteEditor/types";
import {
  appearanceEquals,
  pruneResponsiveAppearance,
} from "../../features/websiteEditor/responsiveAppearance";
import {
  accessiblePreviewViewports,
  PREVIEW_WIDTHS,
  useEditorDeviceCategory,
} from "../../features/websiteEditor/responsiveViewport";
import { useWebsiteDraft } from "../../features/websiteEditor/useWebsiteDraft";
import { WebsiteRenderer } from "../../features/websiteRenderer/WebsiteRenderer";
import {
  globalDesignCapability,
  sectionCapability,
  templateElementCapability,
} from "../../features/websiteCapabilities/lookup";
import type { TemplateCapabilities } from "../../features/websiteCapabilities/types";
import { ApiError } from "../../lib/api";

type BuilderMode = "content" | "design";
type SectionPanelMode = "content" | "appearance";
type DrawerMode = "sections" | "content" | "appearance" | "design";
type MobileDrawerSnap = "hidden" | "medium" | "tall";
type EditorMode = "edit" | "preview";
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
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [sectionDesignSaving, setSectionDesignSaving] = useState(false);
  const [sectionDesignError, setSectionDesignError] = useState<string | null>(
    null,
  );
  const [inlineEditingTarget, setInlineEditingTarget] =
    useState<InlineEditingTarget | null>(null);
  const [selectedNarrativeBlockId, setSelectedNarrativeBlockId] =
    useState<string | null>(null);
  const [designOverride, setDesignOverride] =
    useState<WebsiteDesignSettings | null>(null);
  const [designSaving, setDesignSaving] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);
  const [mediaOverrides, setMediaOverrides] = useState<WebsiteDraft["media"]>(
    {},
  );

  const effectiveSelectedId = draft?.sections.some(
    ({ id }) => id === selectedId,
  )
    ? selectedId
    : (draft?.sections[0]?.id ?? null);
  const authoritativeSelected =
    draft?.sections.find(({ id }) => id === effectiveSelectedId) ?? null;
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

  function selectSection(id: string) {
    if (id === effectiveSelectedId) {
      setInlineEditingTarget(null);
      setSelectedNarrativeBlockId(null);
      return;
    }
    if (sectionDirty) setPendingSelection(id);
    else {
      setSelectedId(id);
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

  async function mutateList(operation: () => Promise<WebsiteDraft>) {
    setListPending(true);
    setListError(null);
    try {
      setDraft(await operation());
    } catch (mutationError) {
      setListError(messageFor(mutationError));
    } finally {
      setListPending(false);
    }
  }

  function toggle(section: WebsiteSection) {
    void mutateList(() =>
      setWebsiteSectionEnabled(
        event.id,
        projectId,
        section.id,
        !section.isEnabled,
      ),
    );
  }
  function move(index: number, direction: -1 | 1) {
    if (!draft) return;
    const ids = draft.sections.map(({ id }) => id);
    const target = index + direction;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void mutateList(() => reorderWebsiteSections(event.id, projectId, ids));
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
    if (!sectionDirty) return;
    setContentOverride(null);
    setAppearanceOverride(null);
    setInlineEditingTarget(null);
    setAppearanceError(null);
    setMediaOverrides({});
    if (selectedNarrativeBlockId && authoritativeSelected?.type === "story") {
      const exists = (
        authoritativeSelected.content as import("../../features/websiteEditor/types").StoryContent
      ).elements.some(({ id }) => id === selectedNarrativeBlockId);
      if (!exists) setSelectedNarrativeBlockId(null);
    }
  }

  function selectNarrativeBlock(blockId: string) {
    setInlineEditingTarget(null);
    setSelectedNarrativeBlockId(blockId);
  }

  function requestInlineEdit(target: InlineEditingTarget) {
    if (target.sectionId !== effectiveSelectedId) return;
    setInlineEditingTarget(target);
    if (target.narrativeBlockId) {
      setSelectedNarrativeBlockId(target.narrativeBlockId);
    } else {
      setSelectedNarrativeBlockId(null);
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
      sections: draft.sections.map((section) => ({
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
  ]);

  async function saveDesign() {
    if (!designOverride) return;
    setDesignSaving(true);
    setDesignError(null);
    try {
      setDraft(
        await updateWebsiteDesignSettings(event.id, projectId, designOverride),
      );
      setDesignOverride(null);
    } catch (saveError) {
      setDesignError(messageFor(saveError));
    } finally {
      setDesignSaving(false);
    }
  }

  async function saveAppearance() {
    if (!effectiveSelectedId || !workingAppearance) return;
    setAppearanceSaving(true);
    setAppearanceError(null);
    try {
      setDraft(
        await updateWebsiteSectionAppearance(
          event.id,
          projectId,
          effectiveSelectedId,
          pruneResponsiveAppearance(workingAppearance),
        ),
      );
      setAppearanceOverride(null);
    } catch (saveError) {
      setAppearanceError(messageFor(saveError));
    } finally {
      setAppearanceSaving(false);
    }
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
  const selected = authoritativeSelected;
  const designSettings = designOverride ?? draft.designSettings;

  const sectionRail = (
    <SectionNavigator
      sections={draft.sections}
      selectedId={effectiveSelectedId}
      pending={listPending}
      onSelect={selectSection}
      onToggle={toggle}
      onMove={move}
    />
  );
  const desktopInspector =
    mode === "design" && draft.template ? (
      <DesignPanel
        settings={designSettings}
        capability={globalDesignCapability(draft.template.capabilities)}
        dirty={designDirty}
        saving={designSaving}
        error={designError}
        eventName={event.name}
        templateKey={draft.templateKey}
        onChange={setDesignOverride}
        onSave={() => void saveDesign()}
      />
    ) : (
      <SectionInspector
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
        panelMode={sectionPanelMode}
        showModeSwitch
        contentDirty={contentDirty}
        appearanceDirty={appearanceDirty}
        sectionDirty={sectionDirty}
        appearanceSaving={appearanceSaving}
        appearanceError={appearanceError}
        sectionDesignSaving={sectionDesignSaving}
        sectionDesignError={sectionDesignError}
        onPanelModeChange={(next) => applyDrawerMode(next)}
        onContentChange={updateWorkingContent}
        onSectionReset={resetSelectedSection}
        onContentSave={(content) =>
          selected
            ? updateWebsiteSectionContent(
                event.id,
                projectId,
                selected.id,
                content,
                selected.type === "story" ? 4 : draft.schemaVersion,
              )
            : Promise.reject()
        }
        onContentSaved={contentSaved}
        onAppearanceChange={(appearance) =>
          selected &&
          setAppearanceOverride({ sectionId: selected.id, appearance })
        }
        onAppearanceSave={() => void saveAppearance()}
        onSectionDesignChange={(defaults) =>
          void saveSectionDesignDefaults(defaults)
        }
      />
    );
  const mobileDrawerPanel =
    drawerMode === "sections" ? (
      <div className="h-full overflow-y-auto overscroll-contain">
        {sectionRail}
      </div>
    ) : drawerMode === "design" && draft.template ? (
      <DesignPanel
        settings={designSettings}
        capability={globalDesignCapability(draft.template.capabilities)}
        dirty={designDirty}
        saving={designSaving}
        error={designError}
        eventName={event.name}
        templateKey={draft.templateKey}
        onChange={setDesignOverride}
        onSave={() => void saveDesign()}
      />
    ) : (
      <SectionInspector
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
        panelMode={drawerMode === "appearance" ? "appearance" : "content"}
        showModeSwitch={false}
        contentDirty={contentDirty}
        appearanceDirty={appearanceDirty}
        sectionDirty={sectionDirty}
        appearanceSaving={appearanceSaving}
        appearanceError={appearanceError}
        sectionDesignSaving={sectionDesignSaving}
        sectionDesignError={sectionDesignError}
        onPanelModeChange={(next) => applyDrawerMode(next)}
        onContentChange={updateWorkingContent}
        onSectionReset={resetSelectedSection}
        onContentSave={(content) =>
          selected
            ? updateWebsiteSectionContent(
                event.id,
                projectId,
                selected.id,
                content,
                selected.type === "story" ? 4 : draft.schemaVersion,
              )
            : Promise.reject()
        }
        onContentSaved={contentSaved}
        onAppearanceChange={(appearance) =>
          selected &&
          setAppearanceOverride({ sectionId: selected.id, appearance })
        }
        onAppearanceSave={() => void saveAppearance()}
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
            sectionDirty || designDirty
              ? "Shows the last saved draft. Unsaved builder changes are not included."
              : "Preview the saved Website on this device"
          }
          aria-label={
            sectionDirty || designDirty
              ? "Preview saved Website draft in a new tab. Unsaved changes are not included."
              : "Preview Website in a new tab"
          }
        >
          <ExternalLink aria-hidden="true" size={15} />
          <span>
            {sectionDirty || designDirty
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

      {listError && (
        <p
          className="shrink-0 border-b border-border bg-danger-muted px-4 py-2 text-sm text-danger"
          role="alert"
        >
          {listError}
        </p>
      )}
      {draft.sections.length === 0 ? (
        <EmptyEditor />
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden xl:grid xl:grid-cols-[240px_minmax(0,1fr)_390px]">
          <aside
            className="hidden min-h-0 overflow-y-auto border-r border-border bg-background p-3 xl:block"
            aria-label="Builder Section rail"
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
            unsaved={sectionDirty || designDirty}
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
            onNarrativeBlockSelect={selectNarrativeBlock}
            onSectionSelect={selectSection}
          />
          <aside
            className="hidden min-h-0 overflow-hidden border-l border-border bg-background p-3 xl:block"
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
                  : `${selected?.displayName ?? "Section"} · ${drawerMode === "appearance" ? "Appearance" : "Content"}`
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
        }}
        onDiscard={() => {
          if (pendingSelection) setSelectedId(pendingSelection);
          if (pendingMode) setMode(pendingMode);
          if (pendingDrawerMode) applyDrawerMode(pendingDrawerMode);
          if (pendingSelection || pendingMode) {
            setInlineEditingTarget(null);
            setSelectedNarrativeBlockId(null);
          }
          setPendingSelection(null);
          setPendingMode(null);
          setPendingDrawerMode(null);
          setContentOverride(null);
          setAppearanceOverride(null);
          setDesignOverride(null);
          setAppearanceError(null);
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
          <div className="mx-auto h-full max-w-2xl">{children}</div>
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
  onNarrativeBlockSelect,
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
  onNarrativeBlockSelect: (blockId: string) => void;
  onSectionSelect: (id: string) => void;
}) {
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
              targetViewport={previewMode}
              scope={
                editorMode === "edit" && selectedId
                  ? { kind: "single-section", sectionId: selectedId }
                  : { kind: "full" }
              }
            />
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

  if (viewport === "desktop")
    return (
      <div className="mx-auto h-full min-h-0 max-w-full overflow-y-auto rounded-lg bg-white shadow-[0_16px_50px_rgb(35_24_18/16%)]">
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
        onLoad={() => {
          const documentTarget = frameRef.current?.contentDocument;
          if (!documentTarget) return;
          document
            .querySelectorAll('style, link[rel="stylesheet"]')
            .forEach((node) =>
              documentTarget.head.appendChild(node.cloneNode(true)),
            );
          documentTarget.documentElement.className =
            document.documentElement.className;
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
  capabilities,
  resolvedMedia,
  onMediaResolved,
  selected,
  workingContent,
  workingAppearance,
  targetViewport,
  selectedNarrativeBlockId,
  panelMode,
  showModeSwitch,
  contentDirty,
  appearanceDirty,
  sectionDirty,
  appearanceSaving,
  appearanceError,
  sectionDesignSaving,
  sectionDesignError,
  onPanelModeChange,
  onContentChange,
  onSectionReset,
  onContentSave,
  onContentSaved,
  onAppearanceChange,
  onAppearanceSave,
  onSectionDesignChange,
}: {
  capabilities?: TemplateCapabilities;
  resolvedMedia: WebsiteDraft["media"];
  onMediaResolved: (media: WebsiteDraft["media"][string]) => void;
  selected: WebsiteSection | null;
  workingContent?: Record<string, unknown>;
  workingAppearance?: WebsiteSectionAppearance;
  targetViewport: ResponsiveViewport;
  selectedNarrativeBlockId: string | null;
  panelMode: SectionPanelMode;
  showModeSwitch: boolean;
  contentDirty: boolean;
  appearanceDirty: boolean;
  sectionDirty: boolean;
  appearanceSaving: boolean;
  appearanceError: string | null;
  sectionDesignSaving: boolean;
  sectionDesignError: string | null;
  onPanelModeChange: (mode: SectionPanelMode) => void;
  onContentChange: (content: Record<string, unknown>) => void;
  onSectionReset: () => void;
  onContentSave: (content: Record<string, unknown>) => Promise<WebsiteDraft>;
  onContentSaved: (draft: WebsiteDraft) => void;
  onAppearanceChange: (appearance: WebsiteSectionAppearance) => void;
  onAppearanceSave: () => void;
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
  const narrativeCapability = capabilities
    ? templateElementCapability(capabilities, "narrativeBlock")
    : undefined;
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="hidden shrink-0 border-b border-border xl:mb-4 xl:block xl:px-0 xl:pb-3 xl:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heading className="xl:text-base!" level={2} variant="panel">
              {narrativeBlock ? "Narrative Block" : selected.displayName}
            </Heading>
            {!selected.isEnabled && (
              <span className="rounded-full bg-surface-muted px-2 py-1 text-[10px] text-foreground-muted">
                Hidden
              </span>
            )}
          </div>
          {showModeSwitch && (
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
        <Text className="mt-2 xl:mt-1" variant="helper">
          {panelMode === "content"
            ? narrativeBlock
              ? "Edit this Narrative Block’s canonical content and visibility."
              : "Edit semantic content."
            : "Customize this Section’s presentation."}
        </Text>
      </div>
      {panelMode === "content" ? (
        narrativeBlock && selected.type === "story" ? (
          <NarrativeBlockContentPanel
            block={narrativeBlock}
            content={
              workingContent as import("../../features/websiteEditor/types").StoryContent
            }
            dirty={contentDirty}
            resetDirty={sectionDirty}
            resolvedMedia={resolvedMedia}
            onMediaResolved={onMediaResolved}
            onChange={onContentChange}
            onSave={onContentSave}
            onSaved={onContentSaved}
            onReset={onSectionReset}
          />
        ) : (
          <div className="min-h-0 flex-1">
            <SectionEditor
              key={selected.id}
              section={selected}
              content={workingContent}
              dirty={contentDirty}
              resetDirty={sectionDirty}
              onChange={onContentChange}
              onReset={onSectionReset}
              onSave={onContentSave}
              onSaved={onContentSaved}
              resolvedMedia={resolvedMedia}
              onMediaResolved={onMediaResolved}
            />
          </div>
        )
      ) : capability ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-6 xl:px-0">
            {narrativeBlock && narrativeCapability && capabilities ? (
              <NarrativeBlockAppearancePanel
                block={narrativeBlock}
                viewport={targetViewport}
                capability={narrativeCapability}
                library={capabilities.designLibrary}
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
            ) : (
              <>
                <AppearancePanel
                  appearance={workingAppearance}
                  sectionCapability={capability}
                  targetViewport={targetViewport}
                  error={appearanceError}
                  onChange={onAppearanceChange}
                />
                <SectionDesignDefaultsPanel
                  appearance={workingAppearance}
                  capability={capability}
                  defaults={selected.designDefaults}
                  resolved={selected.resolvedDesignContext}
                  library={capabilities!.designLibrary}
                  saving={sectionDesignSaving}
                  disabled={appearanceDirty}
                  error={sectionDesignError}
                  onChange={onSectionDesignChange}
                />
              </>
            )}
          </div>
          <BuilderSaveBar
            dirty={narrativeBlock ? contentDirty : appearanceDirty}
            statusDirty={sectionDirty}
            resetDirty={sectionDirty}
            saving={appearanceSaving}
            onSave={() =>
              narrativeBlock
                ? void onContentSave(workingContent).then(onContentSaved)
                : onAppearanceSave()
            }
            onReset={onSectionReset}
          />
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

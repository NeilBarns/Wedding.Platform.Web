import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Dialog, DialogFooter, DialogHeader } from "../../../components/ui/Dialog";
import { IconButton } from "../../../components/ui/IconButton";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { ApiError } from "../../../lib/api";
import { validateSectionContent } from "../schemas";
import type { WebsiteDraft, WebsiteSection } from "../types";
import type { ResolvedWebsiteMedia, SectionMedia } from "../types";
import type { MediaAsset } from "../../media/types";
import { useEventWorkspace } from "../../events/workspace/EventWorkspaceContext";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { FocalPointEditor } from "./FocalPointEditor";
import { ZoomedMediaImage } from "../../websiteRenderer/ZoomedMediaImage";
import { createSemanticId } from "../createSemanticId";
import type { PeopleContent, PeopleGroup, PeoplePerson, StoryBlock, StoryContent } from "../types";
import { useRevealNewItem } from "../useRevealNewItem";
import { BuilderSaveBar } from "./BuilderSaveBar";

type EditorProps = {
  section: WebsiteSection;
  content: Record<string, unknown>;
  dirty: boolean;
  resetDirty: boolean;
  onChange: (content: Record<string, unknown>) => void;
  onReset: () => void;
  onSave: (content: Record<string, unknown>) => Promise<WebsiteDraft>;
  onSaved: (draft: WebsiteDraft) => void;
  resolvedMedia: Record<string, ResolvedWebsiteMedia>;
  onMediaResolved: (media: ResolvedWebsiteMedia) => void;
};
type Field = {
  name: string;
  label: string;
  multiline?: boolean;
  note?: string;
};

function errorText(error: unknown): string {
  if (error instanceof ApiError)
    return error.validationErrors.content?.[0] ?? error.message;
  return "Unable to save this section. Please try again.";
}

function useSectionSave(props: EditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function save() {
    const parsed = validateSectionContent(props.section.type, props.content);
    if (!parsed.success) {
      setError("Review this section and enter valid content before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      props.onSaved(await props.onSave(parsed.data as Record<string, unknown>));
    } catch (saveError) {
      setError(errorText(saveError));
    } finally {
      setSaving(false);
    }
  }
  function reset() {
    setError(null);
    props.onReset();
  }
  return { error, saving, save, reset };
}

function SimpleEditor(props: EditorProps & { fields: Field[] }) {
  const { error, saving, save, reset } = useSectionSave(props);
  return (
    <EditorForm error={error} dirty={props.dirty} resetDirty={props.resetDirty} saving={saving} onSave={save} onReset={reset}>
      {props.section.mediaCapability?.mode === "single" && <SectionMediaEditor {...props} />}
      {props.fields.map((field) => (
        <TextField
          key={field.name}
          label={field.label}
          id={`${props.section.id}-${field.name}`}
          multiline={field.multiline}
          note={field.note}
          value={String(props.content[field.name] ?? "")}
          onChange={(value) =>
            props.onChange({ ...props.content, [field.name]: value })
          }
        />
      ))}
    </EditorForm>
  );
}

function SectionMediaEditor(props: EditorProps) {
  const event = useEventWorkspace();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chosen, setChosen] = useState<MediaAsset | null>(null);
  const media = (props.content.media ?? null) as SectionMedia;
  const resolved = media ? props.resolvedMedia[media.assetId] : undefined;
  const chosenMatches = chosen !== null && chosen.id === media?.assetId;
  const url = chosenMatches ? chosen?.variants.web.url : resolved?.web.url;
  const filename = chosenMatches ? chosen?.originalFilename : resolved?.originalFilename;
  const point = media?.focalPoint ?? { x: 0.5, y: 0.5 };
  return <section className="rounded-lg border border-border bg-surface-muted p-3">
    <h3 className="text-sm font-semibold">Image</h3>
    {media && url ? <div className="mt-3"><FocalPointEditor url={url} point={point} zoom={media.zoom} onChange={({ point: focalPoint, zoom }) => props.onChange({ ...props.content, media: { assetId: media.assetId, focalPoint, zoom } })} /><p className="mt-1 truncate text-xs text-foreground-muted">{filename}</p><div className="mt-2 flex gap-2"><Button size="sm" type="button" variant="secondary" onClick={() => setPickerOpen(true)}>Change image</Button><Button size="sm" type="button" variant="ghost" onClick={() => { setChosen(null); props.onChange({ ...props.content, media: null }) }}>Remove image</Button></div></div> : <div className="mt-2"><p className="text-xs text-foreground-muted">No image selected</p><Button className="mt-2" size="sm" type="button" variant="secondary" onClick={() => setPickerOpen(true)}>Choose from Media</Button></div>}
    <MediaPickerDialog open={pickerOpen} eventId={event.id} selectedAssetId={media?.assetId} onClose={() => setPickerOpen(false)} onSelect={(asset) => { setChosen(asset); props.onMediaResolved({ id: asset.id, originalFilename: asset.originalFilename, width: asset.width, height: asset.height, web: asset.variants.web }); props.onChange({ ...props.content, media: { assetId: asset.id } }); setPickerOpen(false) }} />
  </section>;
}

function StoryEditor(props: EditorProps) {
  const { error, saving, save, reset } = useSectionSave(props);
  const event = useEventWorkspace();
  const reveal = useRevealNewItem();
  const [pickerBlockId, setPickerBlockId] = useState<string | null>(null);
  const content = props.content as StoryContent;
  const blocks = Array.isArray(content.elements) ? content.elements : [];
  const framing = content.mediaFraming ?? {};
  const changeBlocks = (next: StoryBlock[], nextFraming = framing) => props.onChange({ ...props.content, elements: next, mediaFraming: nextFraming });
  const updateBlock = (id: string, update: (block: StoryBlock) => StoryBlock) => changeBlocks(blocks.map((block) => block.id === id ? update(block) : block));
  const updateFraming = (id: string, value: StoryContent['mediaFraming'][string]) => changeBlocks(blocks, { ...framing, [id]: value });
  const removeFraming = (id: string) => { const next = { ...framing }; delete next[id]; return next; };
  const pickerBlock = blocks.find((block) => block.id === pickerBlockId);

  return <EditorForm error={error} dirty={props.dirty} resetDirty={props.resetDirty} saving={saving} onSave={save} onReset={reset}>
    <TextField label="Heading" id={`${props.section.id}-heading`} value={String(content.heading ?? "")} onChange={(heading) => props.onChange({ ...props.content, heading })} />
    <TextField label="Intro (optional)" id={`${props.section.id}-intro`} value={content.intro ?? ""} multiline onChange={(intro) => props.onChange({ ...props.content, intro: intro || null })} />
    <ItemList title="Story blocks" onAdd={() => {
      if (blocks.length >= 20) return;
      const id = createSemanticId("story");
      reveal.reveal(`story-${id}`);
      changeBlocks([...blocks, { id, type: "narrativeBlock", isHidden: false, slots: { eyebrow: { isHidden: true, text: '' }, heading: { isHidden: false, text: '' }, divider: { isHidden: true }, body: { isHidden: false, text: '' }, quote: { isHidden: true, text: '' }, media: { isHidden: true, content: null }, caption: { isHidden: true, text: '' }, cta: { isHidden: true, label: '', action: null } } }]);
    }}>
      {blocks.map((block, index) => {
        const image = block.slots.media.content?.type === 'image' ? block.slots.media.content : undefined;
        const asset = image ? props.resolvedMedia[image.mediaId] : undefined;
        const blockFraming = framing[block.id];
        return <div className="rounded-xl border border-border bg-background p-3 xl:rounded-md" key={block.id} ref={reveal.register(`story-${block.id}`)}>
          <TextField label="Block heading" id={`${props.section.id}-${block.id}-heading`} value={block.slots.heading.text} onChange={(text) => updateBlock(block.id, (current) => ({ ...current, slots: { ...current.slots, heading: { ...current.slots.heading, text } } }))} />
          <div className="mt-3"><TextField label="Body" id={`${props.section.id}-${block.id}-body`} value={block.slots.body.text} multiline onChange={(text) => updateBlock(block.id, (current) => ({ ...current, slots: { ...current.slots, body: { ...current.slots.body, text } } }))} /></div>
          <section className="mt-3 rounded-md border border-border bg-surface-muted p-3">
            <h4 className="text-xs font-semibold">Image</h4>
            {asset && image ? <div className="mt-2">
              <FocalPointEditor url={asset.web.url} point={blockFraming?.focalPoint ?? { x: 0.5, y: 0.5 }} zoom={blockFraming?.zoom} onChange={({ point: focalPoint, zoom }) => updateFraming(block.id, { focalPoint, zoom })} />
              <p className="mt-1 truncate text-xs text-foreground-muted">{asset.originalFilename}</p>
              <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" type="button" variant="secondary" onClick={() => setPickerBlockId(block.id)}>Change image</Button><Button size="sm" type="button" variant="ghost" onClick={() => updateBlock(block.id, (current) => ({ ...current, slots: { ...current.slots, media: { isHidden: true, content: null } } }))}>Remove image</Button></div>
            </div> : <div className="mt-2"><p className="text-xs text-foreground-muted">No image selected</p><Button className="mt-2" size="sm" type="button" variant="secondary" onClick={() => setPickerBlockId(block.id)}>Choose from Media</Button></div>}
          </section>
          <ItemActions label={block.slots.heading.text.trim() || `story block ${index + 1}`} index={index} length={blocks.length} onRemove={() => changeBlocks(blocks.filter((item) => item.id !== block.id), removeFraming(block.id))} onMove={(target) => { const next = [...blocks]; [next[index], next[target]] = [next[target], next[index]]; changeBlocks(next); }} />
        </div>;
      })}
    </ItemList>
    {blocks.length >= 20 && <p className="text-xs text-foreground-muted">Story sections support up to 20 blocks.</p>}
    <MediaPickerDialog open={pickerBlockId !== null} eventId={event.id} selectedAssetId={pickerBlock?.slots.media.content?.type === 'image' ? pickerBlock.slots.media.content.mediaId : undefined} onClose={() => setPickerBlockId(null)} onSelect={(asset) => {
      const blockId = pickerBlockId;
      if (!blockId) return;
      props.onMediaResolved({ id: asset.id, originalFilename: asset.originalFilename, width: asset.width, height: asset.height, web: asset.variants.web });
      changeBlocks(blocks.map((block) => block.id === blockId ? { ...block, slots: { ...block.slots, media: { isHidden: false, content: { type: 'image' as const, mediaId: asset.id } } } } : block), removeFraming(blockId));
      setPickerBlockId(null);
    }} />
  </EditorForm>;
}

function ScheduleEditor(props: EditorProps) {
  const reveal = useRevealNewItem();
  const { error, saving, save, reset } = useSectionSave(props);
  const items = Array.isArray(props.content.items)
    ? (props.content.items as Array<Record<string, string>>)
    : [];
  function updateItem(index: number, field: string, value: string) {
    props.onChange({
      ...props.content,
      items: items.map((item, current) =>
        current === index ? { ...item, [field]: value } : item,
      ),
    });
  }
  function swap(index: number, target: number) {
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    props.onChange({ ...props.content, items: next });
  }
  return (
    <EditorForm error={error} dirty={props.dirty} resetDirty={props.resetDirty} saving={saving} onSave={save} onReset={reset}>
      <TextField
        label="Heading"
        id={`${props.section.id}-heading`}
        value={String(props.content.heading ?? "")}
        onChange={(heading) => props.onChange({ ...props.content, heading })}
      />
      <ItemList
        title="Schedule items"
        onAdd={() => {
          reveal.reveal(`schedule-${items.length}`);
          props.onChange({
            ...props.content,
            items: [...items, { time: "", title: "", description: "" }],
          });
        }}
      >
        {items.map((item, index) => (
          <div
            className="rounded-xl border border-border bg-background p-3 xl:rounded-md"
            key={index}
            ref={reveal.register(`schedule-${index}`)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Time"
                id={`${props.section.id}-${index}-time`}
                value={item.time}
                onChange={(value) => updateItem(index, "time", value)}
              />
              <TextField
                label="Title"
                id={`${props.section.id}-${index}-title`}
                value={item.title}
                onChange={(value) => updateItem(index, "title", value)}
              />
            </div>
            <div className="mt-3">
              <TextField
                label="Description"
                id={`${props.section.id}-${index}-description`}
                value={item.description}
                multiline
                onChange={(value) => updateItem(index, "description", value)}
              />
            </div>
            <ItemActions
              label="schedule item"
              index={index}
              length={items.length}
              onRemove={() =>
                props.onChange({
                  ...props.content,
                  items: items.filter((_, current) => current !== index),
                })
              }
              onMove={(to) => swap(index, to)}
            />
          </div>
        ))}
      </ItemList>
    </EditorForm>
  );
}

function FaqEditor(props: EditorProps) {
  const reveal = useRevealNewItem();
  const { error, saving, save, reset } = useSectionSave(props);
  const items = Array.isArray(props.content.items)
    ? (props.content.items as Array<Record<string, string>>)
    : [];
  function updateItem(index: number, field: string, value: string) {
    props.onChange({
      ...props.content,
      items: items.map((item, current) =>
        current === index ? { ...item, [field]: value } : item,
      ),
    });
  }
  function swap(index: number, target: number) {
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    props.onChange({ ...props.content, items: next });
  }
  return (
    <EditorForm error={error} dirty={props.dirty} resetDirty={props.resetDirty} saving={saving} onSave={save} onReset={reset}>
      <TextField
        label="Heading"
        id={`${props.section.id}-heading`}
        value={String(props.content.heading ?? "")}
        onChange={(heading) => props.onChange({ ...props.content, heading })}
      />
      <ItemList
        title="Questions"
        onAdd={() => {
          reveal.reveal(`faq-${items.length}`);
          props.onChange({
            ...props.content,
            items: [...items, { question: "", answer: "" }],
          });
        }}
      >
        {items.map((item, index) => (
          <div
            className="rounded-xl border border-border bg-background p-3 xl:rounded-md"
            key={index}
            ref={reveal.register(`faq-${index}`)}
          >
            <TextField
              label="Question"
              id={`${props.section.id}-${index}-question`}
              value={item.question}
              onChange={(value) => updateItem(index, "question", value)}
            />
            <div className="mt-3">
              <TextField
                label="Answer"
                id={`${props.section.id}-${index}-answer`}
                value={item.answer}
                multiline
                onChange={(value) => updateItem(index, "answer", value)}
              />
            </div>
            <ItemActions
              label="FAQ item"
              index={index}
              length={items.length}
              onRemove={() =>
                props.onChange({
                  ...props.content,
                  items: items.filter((_, current) => current !== index),
                })
              }
              onMove={(to) => swap(index, to)}
            />
          </div>
        ))}
      </ItemList>
    </EditorForm>
  );
}

function PeopleEditor(props: EditorProps) {
  const { error, saving, save, reset } = useSectionSave(props);
  const event = useEventWorkspace();
  const reveal = useRevealNewItem();
  const [pickerPersonId, setPickerPersonId] = useState<string | null>(null);
  const [focalPersonId, setFocalPersonId] = useState<string | null>(null);
  const content = props.content as PeopleContent;
  const groups = Array.isArray(content.groups) ? content.groups : [];
  const changeGroups = (next: PeopleGroup[]) => props.onChange({ ...props.content, groups: next });
  const updateGroup = (index: number, change: Partial<PeopleGroup>) => changeGroups(groups.map((group, current) => current === index ? { ...group, ...change } : group));
  const findPerson = (personId: string | null) => groups.flatMap((group) => group.people).find((person) => person.id === personId);
  const updatePerson = (personId: string, update: (person: PeoplePerson) => PeoplePerson) => changeGroups(groups.map((group) => ({ ...group, people: group.people.map((person) => person.id === personId ? update(person) : person) })));
  const moveGroup = (index: number, target: number) => {
    const next = [...groups];
    [next[index], next[target]] = [next[target], next[index]];
    changeGroups(next);
  };

  return <EditorForm error={error} dirty={props.dirty} resetDirty={props.resetDirty} saving={saving} onSave={save} onReset={reset}>
    <TextField label="Heading" id={`${props.section.id}-heading`} value={String(content.heading ?? "")} onChange={(heading) => props.onChange({ ...props.content, heading })} />
    <ItemList title="Groups" onAdd={() => { const id = createSemanticId("group"); reveal.reveal(`group-${id}`); changeGroups([...groups, { id, name: "New group", people: [] }]); }}>
      {groups.map((group, groupIndex) => <div className="rounded-xl border border-border bg-background p-3 xl:rounded-md" key={group.id} ref={reveal.register(`group-${group.id}`)}>
        <TextField label="Group name" id={`${props.section.id}-${group.id}-name`} value={group.name} onChange={(name) => updateGroup(groupIndex, { name })} />
        <div className="mt-3 rounded-md bg-surface-muted p-3">
          <ItemList title="People" onAdd={() => { const id = createSemanticId("person"); reveal.reveal(`person-${id}`); updateGroup(groupIndex, { people: [...group.people, { id, name: "", role: null, media: null }] }); }}>
            {group.people.map((person, personIndex) => <div className="rounded-md border border-border bg-surface p-3" key={person.id} ref={reveal.register(`person-${person.id}`)}>
              <TextField label="Name" id={`${props.section.id}-${person.id}-name`} value={person.name} onChange={(name) => updateGroup(groupIndex, { people: group.people.map((item, current) => current === personIndex ? { ...item, name } : item) })} />
              <div className="mt-3"><TextField label="Role or title (optional)" id={`${props.section.id}-${person.id}-role`} value={person.role ?? ""} onChange={(role) => updateGroup(groupIndex, { people: group.people.map((item, current) => current === personIndex ? { ...item, role: role || null } : item) })} /></div>
              {props.section.itemMediaCapability?.itemType === "person" && <PersonMediaEditor person={person} resolvedMedia={props.resolvedMedia} onChoose={() => setPickerPersonId(person.id)} onAdjust={() => setFocalPersonId(person.id)} onRemove={() => updatePerson(person.id, (current) => ({ ...current, media: null }))} />}
              <ItemActions label={person.name.trim() || "person"} index={personIndex} length={group.people.length} onRemove={() => updateGroup(groupIndex, { people: group.people.filter((_, current) => current !== personIndex) })} onMove={(target) => {
                const people = [...group.people];
                [people[personIndex], people[target]] = [people[target], people[personIndex]];
                updateGroup(groupIndex, { people });
              }} />
            </div>)}
          </ItemList>
        </div>
        <ItemActions label={group.name.trim() || "group"} index={groupIndex} length={groups.length} onRemove={() => changeGroups(groups.filter((_, current) => current !== groupIndex))} onMove={(target) => moveGroup(groupIndex, target)} />
      </div>)}
    </ItemList>
    <MediaPickerDialog open={pickerPersonId !== null} eventId={event.id} selectedAssetId={findPerson(pickerPersonId)?.media?.assetId} onClose={() => setPickerPersonId(null)} onSelect={(asset) => { const personId = pickerPersonId; if (!personId) return; props.onMediaResolved({ id: asset.id, originalFilename: asset.originalFilename, width: asset.width, height: asset.height, web: asset.variants.web }); updatePerson(personId, (person) => ({ ...person, media: { assetId: asset.id } })); setPickerPersonId(null); }} />
    <PersonFocalDialog person={findPerson(focalPersonId)} media={props.resolvedMedia} onClose={() => setFocalPersonId(null)} onChange={({ point: focalPoint, zoom }) => { if (focalPersonId) updatePerson(focalPersonId, (person) => person.media ? { ...person, media: { ...person.media, focalPoint, zoom } } : person); }} />
  </EditorForm>;
}

function PersonMediaEditor({ person, resolvedMedia, onChoose, onAdjust, onRemove }: { person: PeoplePerson; resolvedMedia: Record<string, ResolvedWebsiteMedia>; onChoose: () => void; onAdjust: () => void; onRemove: () => void }) {
  const asset = person.media ? resolvedMedia[person.media.assetId] : undefined;
  return <section className="mt-3 rounded-md border border-border bg-surface-muted p-3">
    <h4 className="text-xs font-semibold">Photo</h4>
    {asset && person.media ? <div className="mt-2 flex gap-3"><ZoomedMediaImage className="size-16 rounded-full" height={asset.web.height} reference={person.media} src={asset.web.url} width={asset.web.width} /><div className="min-w-0 flex-1"><p className="truncate text-xs text-foreground-muted">{asset.originalFilename}</p><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" type="button" variant="secondary" onClick={onChoose}>Change</Button><Button size="sm" type="button" variant="secondary" onClick={onAdjust}>Adjust image</Button><Button size="sm" type="button" variant="ghost" onClick={onRemove}>Remove</Button></div></div></div> : <div className="mt-2"><p className="text-xs text-foreground-muted">No photo selected</p><Button className="mt-2" size="sm" type="button" variant="secondary" onClick={onChoose}>Choose from Media</Button></div>}
  </section>;
}

function PersonFocalDialog({ person, media, onClose, onChange }: { person?: PeoplePerson; media: Record<string, ResolvedWebsiteMedia>; onClose: () => void; onChange: (framing: { point: { x: number; y: number }; zoom: number }) => void }) {
  const reference = person?.media;
  const asset = reference ? media[reference.assetId] : undefined;
  return <Dialog open={Boolean(person && asset)} onClose={onClose} titleId="person-focal-title" size="sm">
    <DialogHeader title="Adjust image" titleId="person-focal-title" description={`Position and frame ${person?.name || "this person's"} photo.`} onClose={onClose} />
    {asset && reference && <div className="mt-4"><FocalPointEditor url={asset.web.url} point={reference.focalPoint ?? { x: 0.5, y: 0.5 }} zoom={reference.zoom} onChange={onChange} /></div>}
    <DialogFooter className="mt-5"><Button type="button" onClick={onClose}>Done</Button></DialogFooter>
  </Dialog>;
}

function EditorForm({
  error,
  dirty,
  resetDirty,
  saving,
  onSave,
  onReset,
  children,
}: {
  error: string | null;
  dirty: boolean;
  resetDirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <form
      className="flex h-full min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
      noValidate
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-6 xl:px-0 xl:pb-6">
        {error && (
          <p
            className="rounded-xl bg-danger-muted p-3 text-xs! text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        {children}
      </div>
      <BuilderSaveBar dirty={dirty} statusDirty={resetDirty} resetDirty={resetDirty} saving={saving} onSave={onSave} onReset={onReset} />
    </form>
  );
}

function TextField({
  label,
  id,
  value,
  onChange,
  multiline = false,
  note,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  note?: string;
}) {
  return (
    <div>
      <label
        className="block text-xs! xl:text-sm font-medium mb-0.5"
        htmlFor={id}
      >
        {label}
      </label>
      {multiline ? (
        <Textarea
          id={id}
          className="mt-1 rounded-sm! bg-surface text-sm! xl:py-1.5 xl:text-xs!"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          className="mt-1 bg-surface text-sm! xl:py-1.5 xl:text-xs!"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {note && <p className="mt-1.5 text-xs text-foreground-muted">{note}</p>}
    </div>
  );
}

function ItemList({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <IconButton
          aria-label={`Add ${title.toLowerCase()}`}
          size="sm"
          type="button"
          onClick={onAdd}
        >
          <Plus size={18} aria-hidden="true" />
        </IconButton>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function ItemActions({
  label,
  index,
  length,
  onRemove,
  onMove,
}: {
  label: string;
  index: number;
  length: number;
  onRemove: () => void;
  onMove: (to: number) => void;
}) {
  return (
    <div className="mt-2 flex justify-end gap-1">
      <IconButton
        type="button"
        size="sm"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        aria-label={`Move ${label} up`}
      >
        <ArrowUp size={15} />
      </IconButton>
      <IconButton
        type="button"
        size="sm"
        disabled={index === length - 1}
        onClick={() => onMove(index + 1)}
        aria-label={`Move ${label} down`}
      >
        <ArrowDown size={15} />
      </IconButton>
      <IconButton
        type="button"
        size="sm"
        variant="danger"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        <Trash2 size={15} />
      </IconButton>
    </div>
  );
}

export function SectionEditor(props: EditorProps) {
  switch (props.section.type) {
    case "hero":
      return (
        <SimpleEditor
          {...props}
          fields={[
            { name: "headline", label: "Headline" },
            { name: "subheadline", label: "Subheadline" },
          ]}
        />
      );
    case "date":
      return (
        <SimpleEditor
          {...props}
          fields={[
            { name: "heading", label: "Heading" },
            {
              name: "description",
              label: "Description",
              multiline: true,
              note: "The event date is managed in Event settings.",
            },
          ]}
        />
      );
    case "story":
      return <StoryEditor {...props} />;
    case "schedule":
      return <ScheduleEditor {...props} />;
    case "venue":
      return (
        <SimpleEditor
          {...props}
          fields={[
            { name: "heading", label: "Heading" },
            { name: "name", label: "Venue name" },
            { name: "address", label: "Address", multiline: true },
            { name: "description", label: "Description", multiline: true },
          ]}
        />
      );
    case "dressCode":
      return (
        <SimpleEditor
          {...props}
          fields={[
            { name: "heading", label: "Heading" },
            { name: "description", label: "Description", multiline: true },
          ]}
        />
      );
    case "people":
      return <PeopleEditor {...props} />;
    case "gallery":
      return (
        <SimpleEditor
          {...props}
          fields={[
            {
              name: "heading",
              label: "Heading",
              note: "Photo management will be added in a later phase.",
            },
          ]}
        />
      );
    case "faq":
      return <FaqEditor {...props} />;
    case "rsvp":
      return (
        <SimpleEditor
          {...props}
          fields={[
            { name: "heading", label: "Heading" },
            { name: "description", label: "Description", multiline: true },
            {
              name: "buttonLabel",
              label: "Button label",
              note: "This controls Website presentation only. Guest RSVP configuration is managed separately.",
            },
          ]}
        />
      );
    default:
      return (
        <div className="rounded-xl bg-surface-muted p-4 text-sm text-foreground-muted">
          This section type is not supported by this version of the editor.
        </div>
      );
  }
}

const REVEAL_COMFORT = 24;

export function revealEditorTarget(
  target: HTMLElement,
  comfort = REVEAL_COMFORT,
) {
  const ownerDocument = target.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  if (!ownerWindow) return false;

  const markedContainer = target.closest<HTMLElement>("[data-editor-preview-scroll]");
  const scrollContainer = markedContainer ?? ownerDocument.scrollingElement;
  if (!scrollContainer) return false;

  const targetBounds = target.getBoundingClientRect();
  const containerBounds = markedContainer?.getBoundingClientRect();
  const top = containerBounds?.top ?? 0;
  const bottom = containerBounds?.bottom ?? ownerDocument.documentElement.clientHeight;
  if (bottom <= top || targetBounds.height <= 0) return false;

  const visibleTop = top + comfort;
  const visibleBottom = bottom - comfort;
  const delta = targetBounds.top < visibleTop
    ? targetBounds.top - visibleTop
    : targetBounds.bottom > visibleBottom
      ? targetBounds.bottom - visibleBottom
      : 0;
  if (delta === 0) return false;

  const behavior = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  scrollContainer.scrollBy({ top: delta, behavior });
  return true;
}

export function findEditorTarget(
  documents: readonly Document[],
  selector: string,
) {
  return documents
    .map((candidate) => candidate.querySelector<HTMLElement>(selector))
    .find(Boolean);
}

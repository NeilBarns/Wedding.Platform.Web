import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import type {
  ResolvedWebsiteMedia,
  ResponsiveViewport,
} from "../websiteEditor/types";
import {
  carouselAutoplayStep,
  carouselIndex,
  mediaAutoplayAllowed,
  resolveMediaPresentation,
} from "../websiteElements/media";
import {
  resolveCarouselStyle,
  resolvePeekCarouselGeometry,
  resolvePeekCarouselState,
} from "../websiteElements/peekCarousel";
import {
  resolveStackedPlacement,
  stackedCanvasAspectRatio,
} from "../websiteElements/stackedMedia";
import type { MediaElement } from "../websiteElements/types";
import { ZoomedMediaImage } from "./ZoomedMediaImage";
import { resolveElementInlineAlignment } from "./elementInlineAlignment";

const widths = {
  small: "20rem",
  medium: "32rem",
  large: "48rem",
  full: "100%",
} as const;
const ratios = {
  natural: undefined,
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
  wide: "16 / 9",
} as const;
const radii = {
  square: "0",
  soft: ".5rem",
  rounded: "1.25rem",
  pill: "9999px",
} as const;
const shadows = {
  none: "none",
  soft: "0 4px 16px rgb(0 0 0 / .1)",
  medium: "0 10px 28px rgb(0 0 0 / .16)",
  strong: "0 18px 45px rgb(0 0 0 / .24)",
} as const;

export function MediaElementRenderer({
  element,
  viewport,
  media,
  mode = "public",
}: {
  element: MediaElement;
  viewport: ResponsiveViewport;
  media: Record<string, ResolvedWebsiteMedia>;
  mode?: "editor" | "public";
}) {
  const presentation = resolveMediaPresentation(element, viewport);
  const modeName = element.items.length > 1 ? presentation.mode : "single";
  const carousel = presentation.carousel ?? {};
  const carouselStyle = resolveCarouselStyle(carousel.style);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const paused = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const safeActive = Math.min(active, Math.max(0, element.items.length - 1));
  useEffect(() => {
    if (
      modeName !== "carousel" ||
      !mediaAutoplayAllowed(
        carousel.autoplay ?? false,
        element.items.length,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      )
    )
      return;
    const timer = window.setInterval(() => {
      if (paused.current) return;
      setActive((value) => {
        const step = carouselAutoplayStep(
          value,
          element.items.length,
          carousel.loop !== false,
        );
        if (step.stop) window.clearInterval(timer);
        return step.next;
      });
    }, carousel.interval ?? 5000);
    return () => window.clearInterval(timer);
  }, [
    carousel.autoplay,
    carousel.interval,
    carousel.loop,
    element.items.length,
    modeName,
  ]);

  if (!element.items.length)
    return mode === "editor" ? (
      <div
        data-media-empty
        className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border text-sm text-foreground-muted"
      >
        Choose an image or add a video
      </div>
    ) : null;

  const appearance = element.appearance ?? {};
  const frame = appearance.frame ?? "none";
  const cardStyle: CSSProperties = {
    overflow: "hidden",
    aspectRatio: ratios[presentation.aspectRatio],
    borderRadius: radii[appearance.corners ?? "square"],
    boxShadow: shadows[appearance.shadow ?? "none"],
    border: frame === "line" ? "1px solid currentColor" : undefined,
    padding: frame === "mat" ? ".5rem" : undefined,
    background: frame === "mat" ? "#fff" : undefined,
  };
  const renderItem = (item: MediaElement["items"][number]) => {
    if (item.type === "video")
      return (
        <div style={cardStyle}>
          <video
            className="block h-full w-full"
            style={{ objectFit: presentation.fit }}
            src={item.url}
            controls={item.controls ?? true}
            playsInline
            aria-label="Video"
          />
        </div>
      );
    const asset = media[item.mediaId];
    if (!asset)
      return (
        <div
          style={cardStyle}
          className="grid min-h-32 place-items-center bg-surface-muted text-sm text-foreground-muted"
        >
          Media unavailable
        </div>
      );
    return (
      <div style={cardStyle}>
        {presentation.fit === "contain" ? (
          <img
            className="block h-full w-full object-contain"
            src={asset.web.url}
            width={asset.web.width}
            height={asset.web.height}
            alt={item.decorative ? "" : (item.alt ?? "")}
          />
        ) : (
          <ZoomedMediaImage
            className="h-full w-full"
            height={asset.web.height}
            width={asset.web.width}
            src={asset.web.url}
            reference={item}
            alt={item.decorative ? "" : (item.alt ?? "")}
          />
        )}
      </div>
    );
  };
  const alignedStyle: CSSProperties = {
    display: "flex",
    justifyContent: resolveElementInlineAlignment(
      presentation.alignment === "start"
        ? "flex-start"
        : presentation.alignment === "end"
          ? "flex-end"
          : "center",
    ),
    width: "100%",
  };
  const widthStyle: CSSProperties = {
    width: "100%",
    maxWidth: widths[presentation.width],
  };
  if (modeName === "single")
    return (
      <div data-media-presentation="single" style={alignedStyle}>
        <div style={widthStyle}>{renderItem(element.items[0])}</div>
      </div>
    );

  if (modeName === "stacked") {
    const stackStyle = presentation.stacked?.style ?? "polaroid";
    return (
      <div style={alignedStyle}>
        <div
          data-media-presentation="stacked"
          data-stacked-style={stackStyle}
          style={{
            ...widthStyle,
            position: "relative",
            aspectRatio: stackedCanvasAspectRatio(viewport),
            overflow: "hidden",
          }}
        >
          {element.items.map((item, index) => {
            if (item.type !== "image") return null;
            const placement = resolveStackedPlacement(
              stackStyle,
              index,
              element.items.length,
              viewport,
            );
            const asset = media[item.mediaId];
            const photoRatio =
              ratios[presentation.aspectRatio] ??
              (asset ? `${asset.web.width} / ${asset.web.height}` : "4 / 3");
            const ownPaper = stackStyle === "polaroid";
            const stackCardStyle: CSSProperties = ownPaper
              ? {
                  background: "#fff",
                  padding:
                    viewport === "mobile"
                      ? ".3rem .3rem .7rem"
                      : ".45rem .45rem 1rem",
                  boxShadow: "0 12px 28px rgb(0 0 0 / .18)",
                }
              : {
                  ...cardStyle,
                  boxShadow:
                    appearance.shadow === undefined ||
                    appearance.shadow === "none"
                      ? "0 8px 22px rgb(0 0 0 / .14)"
                      : cardStyle.boxShadow,
                };
            return (
              <div
                key={item.id}
                data-stacked-item={item.id}
                style={{
                  position: "absolute",
                  left: `${placement.leftPercent}%`,
                  top: `${placement.topPercent}%`,
                  width: `${placement.widthPercent}%`,
                  zIndex: placement.zIndex,
                  transform: `translate(-50%, -50%) rotate(${placement.rotation}deg) scale(${placement.scale})`,
                  transformOrigin: "center",
                }}
              >
                <div style={stackCardStyle}>
                  <div
                    style={{
                      aspectRatio: photoRatio,
                      overflow: "hidden",
                      borderRadius: radii[appearance.corners ?? "square"],
                    }}
                  >
                    {asset ? (
                      presentation.fit === "contain" ? (
                        <img
                          className="block h-full w-full object-contain"
                          src={asset.web.url}
                          width={asset.web.width}
                          height={asset.web.height}
                          alt={item.decorative ? "" : (item.alt ?? "")}
                        />
                      ) : (
                        <ZoomedMediaImage
                          className="h-full w-full"
                          height={asset.web.height}
                          width={asset.web.width}
                          src={asset.web.url}
                          reference={item}
                          alt={item.decorative ? "" : (item.alt ?? "")}
                        />
                      )
                    ) : (
                      <div className="grid h-full min-h-24 place-items-center bg-surface-muted text-sm text-foreground-muted">
                        Media unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const last = element.items.length - 1;
  const loop = carousel.loop !== false;
  const previous = () =>
    setActive((value) =>
      carouselIndex(Math.min(value, last), -1, element.items.length, loop),
    );
  const next = () =>
    setActive((value) =>
      carouselIndex(Math.min(value, last), 1, element.items.length, loop),
    );
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    if (event.key === "ArrowLeft") previous();
    else next();
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget))
      paused.current = false;
  };
  const activeAsset =
    element.items[safeActive]?.type === "image"
      ? media[element.items[safeActive].mediaId]
      : undefined;
  const carouselAspectRatio =
    ratios[presentation.aspectRatio] ??
    (activeAsset
      ? `${activeAsset.web.width} / ${activeAsset.web.height}`
      : "4 / 3");
  const controlInset =
    viewport === "mobile"
      ? ".625rem"
      : viewport === "tablet"
        ? ".75rem"
        : "1rem";
  const renderDots = () =>
    carousel.dots !== false ? (
      <div
        data-carousel-dots
        className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center text-white"
        style={{ bottom: controlInset }}
      >
        {element.items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Show photo ${index + 1} of ${element.items.length}`}
            aria-current={index === safeActive ? "true" : undefined}
            className="grid size-4 place-items-center rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/80 sm:size-5"
            onClick={() => setActive(index)}
          >
            <span
              aria-hidden="true"
              className={`border border-white/80 drop-shadow-[0_1px_2px_rgb(0_0_0/.7)] ${index === safeActive ? "h-1 w-3 rounded-sm bg-white sm:h-1.5 sm:w-3.5" : "size-1 rounded-full bg-white/40 sm:size-1.5"}`}
            />
          </button>
        ))}
      </div>
    ) : null;
  return (
    <div style={alignedStyle}>
      <div
        data-media-presentation="carousel"
        data-carousel-style={carouselStyle}
        role="region"
        aria-roledescription="carousel"
        aria-label="Photo carousel"
        tabIndex={0}
        style={widthStyle}
        onKeyDown={onKeyDown}
        onMouseEnter={() => {
          paused.current = true;
        }}
        onMouseLeave={() => {
          paused.current = false;
        }}
        onFocus={() => {
          paused.current = true;
        }}
        onBlur={onBlur}
      >
        <div
          data-carousel-viewport
          style={{
            position: "relative",
            width: "100%",
            ...(carouselStyle === "peek"
              ? { aspectRatio: carouselAspectRatio, overflow: "hidden" }
              : {}),
          }}
        >
          {carouselStyle === "peek" ? (
            element.items.map((item, index) => {
              const state = resolvePeekCarouselState(
                index,
                safeActive,
                element.items.length,
                loop,
              );
              const geometry = resolvePeekCarouselGeometry(
                state,
                viewport,
                reducedMotion,
              );
              return (
                <div
                  key={item.id}
                  data-carousel-item={item.id}
                  data-carousel-state={state}
                  data-carousel-active-card={
                    state === "active" ? true : undefined
                  }
                  aria-hidden={state === "active" ? undefined : true}
                  aria-current={state === "active" ? "true" : undefined}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: `${geometry.leftPercent}%`,
                    width: `${geometry.widthPercent}%`,
                    zIndex: geometry.zIndex,
                    opacity: geometry.opacity,
                    visibility: state === "hidden" ? "hidden" : "visible",
                    pointerEvents: state === "active" ? "auto" : "none",
                    transform: `translate(${geometry.translatePercent}%, -50%) scale(${geometry.scale}) rotate(${geometry.rotation}deg)`,
                    transformOrigin: "center",
                    transition: reducedMotion
                      ? "opacity 120ms ease"
                      : "left 450ms ease, width 450ms ease, transform 450ms ease, opacity 300ms ease",
                  }}
                >
                  <div
                    className="h-full [&>div]:h-full"
                    style={{ aspectRatio: carouselAspectRatio }}
                  >
                    {renderItem(item)}
                  </div>
                  {state === "active" && renderDots()}
                </div>
              );
            })
          ) : (
            <div
              data-carousel-item={element.items[safeActive].id}
              data-carousel-state="active"
              data-carousel-active-card="true"
              aria-current="true"
              style={{ position: "relative" }}
            >
              {renderItem(element.items[safeActive])}
              {renderDots()}
            </div>
          )}
          {carousel.arrows !== false && (
            <div
              data-carousel-arrows
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between"
              style={{ paddingInline: controlInset }}
            >
              <button
                type="button"
                aria-label="Previous photo"
                disabled={!loop && safeActive === 0}
                className="pointer-events-auto grid size-11 place-items-center rounded-full bg-black/20 text-2xl leading-none text-white shadow-sm backdrop-blur-[2px] outline-none transition-colors hover:bg-black/35 focus-visible:bg-black/40 focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-30 sm:size-10"
                onClick={previous}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next photo"
                disabled={!loop && safeActive === last}
                className="pointer-events-auto grid size-11 place-items-center rounded-full bg-black/20 text-2xl leading-none text-white shadow-sm backdrop-blur-[2px] outline-none transition-colors hover:bg-black/35 focus-visible:bg-black/40 focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-30 sm:size-10"
                onClick={next}
              >
                ›
              </button>
            </div>
          )}
        </div>
        <p data-carousel-position className="sr-only">
          Photo {safeActive + 1} of {element.items.length}
        </p>
      </div>
    </div>
  );
}

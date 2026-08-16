const templateThumbnails: Record<string, React.ReactNode> = {
  'classic-filipiniana-v1': <div className="relative grid h-36 place-items-center overflow-hidden bg-[#f3e8d8] text-[#774b3e]" aria-hidden="true"><div className="absolute inset-4 border border-[#ad7b68]/40" /><div className="text-center"><div className="mx-auto h-px w-12 bg-[#9d5b45]" /><div className="mt-4 font-serif text-lg">Classic</div><div className="mt-1 text-[7px] uppercase tracking-[0.32em]">Filipiniana</div><div className="mx-auto mt-4 h-px w-8 bg-[#9d5b45]" /></div></div>,
  'modern-editorial-v1': <div className="relative h-36 overflow-hidden bg-[#f4f2ed] p-5 text-[#171717]" aria-hidden="true"><div className="h-px bg-[#171717]" /><div className="mt-3 grid grid-cols-[1fr_2.2fr] gap-4"><span className="text-[7px] font-semibold uppercase tracking-[0.2em]">Edition 01</span><div><div className="h-3 w-4/5 bg-[#171717]" /><div className="mt-1.5 h-3 w-3/5 bg-[#171717]" /><div className="mt-4 h-px bg-[#aaa49a]" /><div className="mt-2 h-1 w-full bg-[#d1cdc5]" /><div className="mt-1 h-1 w-4/5 bg-[#d1cdc5]" /></div></div><div className="absolute bottom-4 left-5 text-[8px] uppercase tracking-[0.3em]">Modern Editorial</div></div>,
}

export function TemplateThumbnail({ templateKey }: { templateKey: string }) {
  return templateThumbnails[templateKey] ?? <div className="grid h-36 place-items-center bg-surface-muted text-xs text-foreground-muted" aria-hidden="true">Preview unavailable</div>
}

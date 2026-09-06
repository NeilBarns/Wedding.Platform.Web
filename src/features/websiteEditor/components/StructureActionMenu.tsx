import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../../components/ui/IconButton";

export function StructureActionMenu({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`relative ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <IconButton
        type="button"
        size="sm"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal size={15} />
      </IconButton>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute text-xs right-0 top-full z-30 w-40 rounded-md border border-border bg-surface p-1 shadow-[var(--shadow-dialog)]"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function StructureMenuAction({
  children,
  icon,
  danger = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-40 ${danger ? "text-danger hover:bg-danger-muted" : "hover:bg-surface-muted"}`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

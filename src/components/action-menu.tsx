import type { ReactNode } from "react";

export function ActionMenu({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-20 cursor-default bg-transparent"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <div className="absolute end-2 top-12 z-30 min-w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
        {children}
      </div>
    </>
  );
}

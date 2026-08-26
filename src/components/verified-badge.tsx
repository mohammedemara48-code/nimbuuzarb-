import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("nimb-verified inline-block size-4 shrink-0 overflow-visible", className)}
      aria-hidden="true"
    >
      <path
        fill="#1877F2"
        d="M12 2.2 14.2 4l2.7-.4 1.3 2.4 2.4 1.3-.4 2.7L22 12l-1.8 2.2.4 2.7-2.4 1.3-1.3 2.4-2.7-.4L12 21.8 9.8 20l-2.7.4-1.3-2.4-2.4-1.3.4-2.7L2 12l1.8-2.2-.4-2.7 2.4-1.3L7.1 3.6l2.7.4L12 2.2z"
      />
      <path
        d="M7.4 12.1 10.2 15l6.4-6.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

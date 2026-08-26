import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initial = name.trim().charAt(0) || "؟";
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full bg-bg",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover object-center" />
      ) : (
        <span className="grid h-full w-full place-items-center font-medium text-muted">
          {initial}
        </span>
      )}
    </span>
  );
}

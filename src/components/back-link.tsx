import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

type Dest = "/" | "/profile" | "/messages" | "/rooms" | "/feed";

export function BackLink({
  to,
  className = "grid size-11 place-items-center rounded-md",
}: {
  to: Dest;
  className?: string;
}) {
  return (
    <Link to={to} replace aria-label="رجوع" className={className}>
      <ArrowRight className="size-5" />
    </Link>
  );
}

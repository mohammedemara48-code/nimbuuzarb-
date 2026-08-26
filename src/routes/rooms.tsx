import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Hash } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listRooms } from "@/lib/nimb/server";
import { formatWhen } from "@/lib/nimb/time";

export const Route = createFileRoute("/rooms")({ component: Rooms });

function Rooms() {
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: () => listRooms() });
  return (
    <AppShell title="الغرف">
      <ul className="p-3">
        {(rooms.data ?? []).map((room) => (
          <li key={room.id}>
            <Link
              to="/room/$id"
              params={{ id: room.id }}
              replace
              className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface"
            >
              <span className="grid size-12 place-items-center rounded-lg bg-elevated text-primary">
                <Hash className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{room.name}</span>
                  {room.lastAt && (
                    <span className="text-[11px] text-subtle">{formatWhen(room.lastAt)}</span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {room.lastBody || room.topic}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BackLink } from "@/components/back-link";
import { RequireAuth } from "@/components/require-auth";
import { getStory } from "@/lib/nimb/server";

export const Route = createFileRoute("/story/$id")({ component: StoryView });

function StoryView() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["story", id], queryFn: () => getStory({ data: id }) });
  const st = q.data;

  return (
    <RequireAuth>
      <div className="relative mx-auto min-h-dvh w-full max-w-lg bg-bg">
        {st && <img src={st.image} alt="" className="h-dvh w-full object-cover" />}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-bg/80 to-transparent px-3 pb-8 pt-[max(0.8rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{st?.author?.displayName}</p>
            <BackLink to="/feed" className="grid size-11 place-items-center rounded-md text-sm" />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

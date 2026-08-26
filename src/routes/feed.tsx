import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { readAsDataUrl } from "@/lib/nimb/files";
import { addPost, addStory, ensureMe, listFeed } from "@/lib/nimb/server";

export const Route = createFileRoute("/feed")({ component: Feed });

function Feed() {
  const qc = useQueryClient();
  const feed = useQuery({ queryKey: ["feed"], queryFn: () => listFeed() });
  const me = useQuery({ queryKey: ["me"], queryFn: () => ensureMe() });
  const [composer, setComposer] = useState<"photo" | "story" | null>(null);
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const myId = me.data?.userId;

  const publish = useMutation({
    mutationFn: async () => {
      if (!composer) return;
      if (composer === "photo" && image && !body.trim()) {
        await addStory({ data: { image } });
      }
      await addPost({ data: { kind: composer, body, image } });
    },
    onSuccess: () => {
      setComposer(null);
      setBody("");
      setImage(undefined);
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["user-posts"] });
    },
  });

  const posts = feed.data?.posts ?? [];
  const stories = feed.data?.stories ?? [];

  return (
    <AppShell
      title="المجتمع"
      action={
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={() => setComposer("story")}>
            تجربة
          </Button>
          <Button size="sm" onClick={() => setComposer("photo")}>
            <Plus className="size-3.5" />
            صورة
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-3">
        <div className="flex gap-3 overflow-x-auto px-4 pb-1">
          <label className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1">
            <span className="grid size-12 place-items-center rounded-full border border-dashed border-primary text-primary">
              <Plus className="size-5" />
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void readAsDataUrl(file).then((img) =>
                  addStory({ data: { image: img } }).then(() => qc.invalidateQueries({ queryKey: ["feed"] })),
                );
              }}
            />
          </label>
          {stories.map((st) =>
            st.author ? (
              <Link
                key={st.id}
                to="/story/$id"
                params={{ id: st.id }}
                replace
                className="flex w-16 shrink-0 flex-col items-center gap-1"
              >
                <span className="rounded-full bg-primary p-0.5">
                  <Avatar src={st.author.avatarUrl} name={st.author.displayName} className="ring-2 ring-bg" />
                </span>
                <span className="w-full truncate text-center text-[11px] text-muted">
                  {st.author.displayName}
                </span>
              </Link>
            ) : null,
          )}
        </div>

        {composer && (
          <div className="mx-4 space-y-2 rounded-xl border border-border bg-surface p-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
            />
            <input
              type="file"
              accept="image/*"
              className="block w-full text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void readAsDataUrl(file).then(setImage);
              }}
            />
            {image && <img src={image} alt="" className="max-h-40 w-full rounded-md object-cover" />}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setComposer(null)}>
                إلغاء
              </Button>
              <Button className="flex-1" onClick={() => publish.mutate()}>
                نشر
              </Button>
            </div>
          </div>
        )}

        <ul className="space-y-4 px-4 pb-6">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} myId={myId} />
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

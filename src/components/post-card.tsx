import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/verified-badge";
import { commentPost, likePost } from "@/lib/nimb/server";
import { formatWhen } from "@/lib/nimb/time";
import { cn } from "@/lib/utils";

export type FeedPost = {
  id: string;
  kind: string;
  body: string;
  image?: string;
  createdAt: string;
  author: {
    userId: string;
    displayName: string;
    avatarUrl: string;
    verified?: boolean;
  } | null;
  likes: string[];
  comments: {
    id: string;
    body: string;
    createdAt: string;
    author: { displayName: string } | null;
  }[];
};

export function PostCard({ post, myId }: { post: FeedPost; myId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const liked = Boolean(myId && post.likes.includes(myId));
  const name = post.author?.displayName ?? "حساب";

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["feed"] });
    void qc.invalidateQueries({ queryKey: ["user-posts"] });
  };

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {post.author ? (
          <Link to="/person/$id" params={{ id: post.author.userId }} className="contents">
            <Avatar src={post.author.avatarUrl} name={name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="flex max-w-full items-center gap-1 text-sm font-semibold">
                <span className="truncate">{name}</span>
                {post.author.verified && <VerifiedBadge className="size-4" />}
              </p>
              <p className="text-[11px] text-subtle">{formatWhen(post.createdAt)}</p>
            </div>
          </Link>
        ) : (
          <p className="text-sm font-semibold">{name}</p>
        )}
      </div>
      {post.image && <img src={post.image} alt="" className="aspect-[4/3] w-full object-cover" />}
      {post.body ? <p className="px-3 pt-3 text-sm leading-relaxed">{post.body}</p> : null}
      <div className="flex items-center gap-1 px-2 py-1">
        <button
          type="button"
          className={cn("inline-flex h-11 items-center gap-1.5 px-2 text-sm", liked ? "text-primary" : "text-muted")}
          onClick={() => void likePost({ data: post.id }).then(refresh)}
        >
          <Heart className={cn("size-4", liked && "fill-primary")} />
          {post.likes.length}
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center gap-1.5 px-2 text-sm text-muted"
          onClick={() => setOpen((v) => !v)}
        >
          <MessageCircle className="size-4" />
          {post.comments.length}
        </button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-border px-3 py-3">
          {post.comments.map((c) => (
            <p key={c.id} className="text-sm">
              <span className="font-medium">{c.author?.displayName ?? "حساب"}</span>{" "}
              <span className="text-muted">{c.body}</span>
            </p>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const body = draft.trim();
              if (!body) return;
              setDraft("");
              void commentPost({ data: { postId: post.id, body } }).then(refresh);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-sm"
            />
            <Button size="sm" type="submit">
              إرسال
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}

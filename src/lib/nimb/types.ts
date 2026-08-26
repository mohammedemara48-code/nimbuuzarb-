export type Person = {
  id: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  photo: string;
  online: boolean;
  looking: "رجال" | "نساء";
};

export type Room = {
  id: string;
  name: string;
  topic: string;
  members: number;
};

export type ChatKind = "text" | "image" | "audio" | "video";

export type ChatMessage = {
  id: string;
  threadId: string;
  sender: "me" | "them" | string;
  kind: ChatKind;
  body: string;
  media?: string;
  viewOnce: boolean;
  viewed: boolean;
  createdAt: string;
};

export type PostKind = "photo" | "story";

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Post = {
  id: string;
  authorId: string;
  kind: PostKind;
  body: string;
  image?: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
};

export type Status = {
  id: string;
  authorId: string;
  image: string;
  seen: boolean;
};

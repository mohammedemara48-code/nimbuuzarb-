export type Presence = "online" | "away" | "offline";

export type Contact = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  presence: Presence;
};

export type Conversation = {
  id: string;
  contact: Contact;
  lastBody: string;
  lastAt: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: "me" | "them";
  body: string;
  kind: "text" | "call";
  createdAt: string;
};

export type Thread = {
  conversation: Conversation;
  messages: ChatMessage[];
};

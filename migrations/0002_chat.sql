create table if not exists contacts (
  id text primary key,
  user_id text not null,
  name text not null,
  handle text not null,
  avatar text not null,
  presence text not null default 'offline',
  created_at timestamptz not null default now()
);
create index if not exists contacts_user_id_idx on contacts (user_id);

create table if not exists conversations (
  id text primary key,
  user_id text not null,
  contact_id text not null,
  last_body text not null default '',
  last_at timestamptz not null default now(),
  unread integer not null default 0
);
create index if not exists conversations_user_id_idx on conversations (user_id);

create table if not exists messages (
  id text primary key,
  user_id text not null,
  conversation_id text not null,
  sender text not null,
  body text not null,
  kind text not null default 'text',
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);

alter table nimb_profiles add column if not exists phone text not null default '';
alter table nimb_profiles add column if not exists dial text not null default '+966';
alter table nimb_profiles add column if not exists verified boolean not null default false;

update nimb_profiles set is_owner = false;

create table if not exists nimb_notifications (
  id text primary key,
  user_id text not null,
  actor_id text not null,
  kind text not null,
  post_id text,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists nimb_notifications_user_idx on nimb_notifications (user_id, created_at desc);

create table if not exists nimb_blocks (
  user_id text not null,
  peer_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, peer_id)
);

create table if not exists nimb_verify_requests (
  user_id text primary key,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists nimb_highlights (
  id text primary key,
  user_id text not null,
  title text not null,
  body text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists nimb_highlights_user_idx on nimb_highlights (user_id, created_at desc);

create table if not exists nimb_profiles (
  user_id text primary key,
  display_name text not null,
  email text not null,
  serial integer not null unique,
  avatar_url text not null default '',
  bio text not null default '',
  city text not null default '',
  looking text not null default '',
  is_owner boolean not null default false,
  online_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists nimb_profiles_serial_idx on nimb_profiles (serial);
create index if not exists nimb_profiles_online_idx on nimb_profiles (online_at);

create table if not exists nimb_friends (
  requester_id text not null,
  addressee_id text not null,
  status text not null,
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id)
);
create index if not exists nimb_friends_addressee_idx on nimb_friends (addressee_id, status);

create table if not exists nimb_messages (
  id text primary key,
  sender_id text not null,
  recipient_id text,
  room_id text,
  kind text not null default 'text',
  body text not null default '',
  media text,
  view_once boolean not null default false,
  viewed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists nimb_messages_dm_idx on nimb_messages (sender_id, recipient_id, created_at);
create index if not exists nimb_messages_room_idx on nimb_messages (room_id, created_at);

create table if not exists nimb_posts (
  id text primary key,
  author_id text not null,
  kind text not null,
  body text not null default '',
  image text,
  created_at timestamptz not null default now()
);
create index if not exists nimb_posts_created_idx on nimb_posts (created_at desc);

create table if not exists nimb_post_likes (
  post_id text not null,
  user_id text not null,
  primary key (post_id, user_id)
);

create table if not exists nimb_post_comments (
  id text primary key,
  post_id text not null,
  author_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists nimb_stories (
  id text primary key,
  author_id text not null,
  image text not null,
  created_at timestamptz not null default now()
);

create table if not exists nimb_rooms (
  id text primary key,
  name text not null,
  topic text not null
);

create table if not exists nimb_call_logs (
  id text primary key,
  user_id text not null,
  peer_id text not null,
  kind text not null,
  direction text not null,
  outcome text not null,
  duration_sec integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists nimb_call_logs_user_idx on nimb_call_logs (user_id, created_at desc);

insert into nimb_rooms (id, name, topic) values
  ('gulf', 'مجتمع الخليج', 'مساحة خاصة للتعارف بأمان'),
  ('jeddah', 'تعارف جدة', 'ناس قريبة، كلام أوضح'),
  ('late', 'سهر وأمان', 'بعد ١٢، الصراحة مسموحة'),
  ('stories', 'تجاربنا', 'قصص وتعارف من غير أحكام')
on conflict (id) do nothing;

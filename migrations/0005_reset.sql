delete from nimb_friends;
delete from nimb_messages;
delete from nimb_post_likes;
delete from nimb_post_comments;
delete from nimb_posts;
delete from nimb_stories;
delete from nimb_call_logs;
delete from nimb_notifications;
delete from nimb_blocks;
delete from nimb_verify_requests;
delete from nimb_highlights;
delete from nimb_profiles;
delete from "session";
delete from "account";
delete from "verification";
delete from "user";

update nimb_rooms set topic = '' where id in ('gulf', 'jeddah', 'late', 'stories');

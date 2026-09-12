CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" varchar(32) NOT NULL,
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "passkeys_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"device_name" varchar(100),
	"device_type" varchar(50),
	"is_revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_presence" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'OFFLINE' NOT NULL,
	"active_meeting_id" uuid,
	"socket_id" varchar(128),
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_presence_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(150) NOT NULL,
	"password_hash" text,
	"avatar_url" text,
	"cover_url" text,
	"bio" text,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"theme" varchar(20) DEFAULT 'system' NOT NULL,
	"presence_status" varchar(20) DEFAULT 'OFFLINE' NOT NULL,
	"role" varchar(30) DEFAULT 'USER' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "meeting_invites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"invited_by" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'PARTICIPANT' NOT NULL,
	"token" varchar(128) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "meeting_participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"role" varchar(20) DEFAULT 'PARTICIPANT' NOT NULL,
	"is_audio_muted" boolean DEFAULT true NOT NULL,
	"is_video_muted" boolean DEFAULT false NOT NULL,
	"is_screen_sharing" boolean DEFAULT false NOT NULL,
	"is_hand_raised" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"connection_status" varchar(20) DEFAULT 'CONNECTED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"waiting_room_enabled" boolean DEFAULT false NOT NULL,
	"auto_recording" boolean DEFAULT false NOT NULL,
	"mute_on_join" boolean DEFAULT true NOT NULL,
	"camera_off_on_join" boolean DEFAULT false NOT NULL,
	"disable_screen_share" boolean DEFAULT false NOT NULL,
	"disable_chat" boolean DEFAULT false NOT NULL,
	"disable_file_share" boolean DEFAULT false NOT NULL,
	"disable_reactions" boolean DEFAULT false NOT NULL,
	"lock_meeting" boolean DEFAULT false NOT NULL,
	"allow_guest_users" boolean DEFAULT true NOT NULL,
	"max_participants" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_settings_meeting_id_unique" UNIQUE("meeting_id")
);
--> statement-breakpoint
CREATE TABLE "meeting_waiting_room" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_identifier" varchar(100),
	"display_name" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"processed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"host_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(50) NOT NULL,
	"type" varchar(20) DEFAULT 'INSTANT' NOT NULL,
	"access_level" varchar(20) DEFAULT 'PUBLIC' NOT NULL,
	"passcode" varchar(32),
	"scheduled_start_at" timestamp with time zone,
	"scheduled_end_at" timestamp with time zone,
	"actual_start_at" timestamp with time zone,
	"actual_end_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'SCHEDULED' NOT NULL,
	"recurrence_rule" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "meetings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "meeting_chat_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid,
	"reply_to_id" uuid,
	"content" text NOT NULL,
	"message_type" varchar(20) DEFAULT 'TEXT' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_chat_reactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_recordings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"triggered_by" uuid,
	"type" varchar(20) DEFAULT 'CLOUD' NOT NULL,
	"format" varchar(10) DEFAULT 'MP4' NOT NULL,
	"file_url" text,
	"file_size_bytes" bigint,
	"duration_seconds" integer,
	"status" varchar(20) DEFAULT 'INITIALIZING' NOT NULL,
	"s3_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_streams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"platform" varchar(30) NOT NULL,
	"rtmp_url" text NOT NULL,
	"stream_key" text NOT NULL,
	"status" varchar(20) DEFAULT 'STARTING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_polls" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"poll_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"option_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breakout_participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"breakout_room_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "breakout_rooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"duration_minutes" integer DEFAULT 15 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whiteboard_elements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"whiteboard_id" uuid NOT NULL,
	"element_id" varchar(128) NOT NULL,
	"type" varchar(30) NOT NULL,
	"data" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whiteboards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid NOT NULL,
	"title" varchar(150) DEFAULT 'Untitled Board' NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"email_reminders" boolean DEFAULT true NOT NULL,
	"email_invites" boolean DEFAULT true NOT NULL,
	"push_new_messages" boolean DEFAULT true NOT NULL,
	"in_app_sounds" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"uploader_id" uuid NOT NULL,
	"meeting_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"s3_key" text NOT NULL,
	"file_url" text NOT NULL,
	"scan_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid,
	"user_id" uuid,
	"event_name" varchar(100) NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"target_type" varchar(50) NOT NULL,
	"target_id" varchar(128) NOT NULL,
	"action" varchar(100) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_user_id" uuid,
	"reported_meeting_id" uuid,
	"reason" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "meeting_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"settings" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_presence" ADD CONSTRAINT "user_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invites" ADD CONSTRAINT "meeting_invites_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invites" ADD CONSTRAINT "meeting_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_settings" ADD CONSTRAINT "meeting_settings_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_waiting_room" ADD CONSTRAINT "meeting_waiting_room_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_waiting_room" ADD CONSTRAINT "meeting_waiting_room_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_waiting_room" ADD CONSTRAINT "meeting_waiting_room_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_chat_messages" ADD CONSTRAINT "meeting_chat_messages_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_chat_messages" ADD CONSTRAINT "meeting_chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_chat_messages" ADD CONSTRAINT "meeting_chat_messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_chat_reactions" ADD CONSTRAINT "meeting_chat_reactions_message_id_meeting_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."meeting_chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_chat_reactions" ADD CONSTRAINT "meeting_chat_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_recordings" ADD CONSTRAINT "meeting_recordings_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_recordings" ADD CONSTRAINT "meeting_recordings_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_streams" ADD CONSTRAINT "meeting_streams_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_polls" ADD CONSTRAINT "meeting_polls_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_polls" ADD CONSTRAINT "meeting_polls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_meeting_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."meeting_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakout_participants" ADD CONSTRAINT "breakout_participants_breakout_room_id_breakout_rooms_id_fk" FOREIGN KEY ("breakout_room_id") REFERENCES "public"."breakout_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakout_participants" ADD CONSTRAINT "breakout_participants_participant_id_meeting_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."meeting_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakout_rooms" ADD CONSTRAINT "breakout_rooms_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whiteboard_elements" ADD CONSTRAINT "whiteboard_elements_whiteboard_id_whiteboards_id_fk" FOREIGN KEY ("whiteboard_id") REFERENCES "public"."whiteboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whiteboard_elements" ADD CONSTRAINT "whiteboard_elements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_meeting_id_meetings_id_fk" FOREIGN KEY ("reported_meeting_id") REFERENCES "public"."meetings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_templates" ADD CONSTRAINT "meeting_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkeys_user_id_idx" ON "passkeys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "passkeys_credential_id_idx" ON "passkeys" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_refresh_token_idx" ON "sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_presence_status_idx" ON "user_presence" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_presence_active_meeting_idx" ON "user_presence" USING btree ("active_meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_presence_idx" ON "users" USING btree ("presence_status");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "invites_meeting_id_idx" ON "meeting_invites" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "invites_email_idx" ON "meeting_invites" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "invites_token_idx" ON "meeting_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "participants_meeting_id_idx" ON "meeting_participants" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "participants_user_id_idx" ON "meeting_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "participants_role_idx" ON "meeting_participants" USING btree ("role");--> statement-breakpoint
CREATE INDEX "waiting_room_meeting_id_idx" ON "meeting_waiting_room" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "waiting_room_status_idx" ON "meeting_waiting_room" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "meetings_slug_idx" ON "meetings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "meetings_host_id_idx" ON "meetings" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "meetings_status_idx" ON "meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meetings_scheduled_start_idx" ON "meetings" USING btree ("scheduled_start_at");--> statement-breakpoint
CREATE INDEX "chat_messages_meeting_id_idx" ON "meeting_chat_messages" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "chat_messages_sender_id_idx" ON "meeting_chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "meeting_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_reactions_message_id_idx" ON "meeting_chat_reactions" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "chat_reactions_user_id_idx" ON "meeting_chat_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recordings_meeting_id_idx" ON "meeting_recordings" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "recordings_status_idx" ON "meeting_recordings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "streams_meeting_id_idx" ON "meeting_streams" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "streams_status_idx" ON "meeting_streams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "polls_meeting_id_idx" ON "meeting_polls" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "polls_is_active_idx" ON "meeting_polls" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "poll_votes_user_idx" ON "poll_votes" USING btree ("poll_id","user_id");--> statement-breakpoint
CREATE INDEX "poll_votes_poll_id_idx" ON "poll_votes" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "breakout_participants_room_idx" ON "breakout_participants" USING btree ("breakout_room_id");--> statement-breakpoint
CREATE INDEX "breakout_participants_participant_idx" ON "breakout_participants" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "breakout_rooms_meeting_id_idx" ON "breakout_rooms" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "whiteboard_elements_board_idx" ON "whiteboard_elements" USING btree ("whiteboard_id");--> statement-breakpoint
CREATE INDEX "whiteboard_elements_elem_id_idx" ON "whiteboard_elements" USING btree ("element_id");--> statement-breakpoint
CREATE INDEX "whiteboards_meeting_id_idx" ON "whiteboards" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "file_uploads_uploader_id_idx" ON "file_uploads" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "file_uploads_meeting_id_idx" ON "file_uploads" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "analytics_meeting_id_idx" ON "analytics_events" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "analytics_event_name_idx" ON "analytics_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "analytics_timestamp_idx" ON "analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_reporter_id_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "meeting_templates_user_id_idx" ON "meeting_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meeting_templates_is_default_idx" ON "meeting_templates" USING btree ("is_default");
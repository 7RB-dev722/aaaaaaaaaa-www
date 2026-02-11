-- Add columns for special Discord notifications to the site_settings table

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS special_discord_webhook_url_1 text DEFAULT '',
ADD COLUMN IF NOT EXISTS special_discord_user_id_1 text DEFAULT '',
ADD COLUMN IF NOT EXISTS special_discord_webhook_url_2 text DEFAULT '',
ADD COLUMN IF NOT EXISTS special_discord_user_id_2 text DEFAULT '';

-- Note: Depending on your Supabase/PostgreSQL version, you might need to run these separately or in a specific way.
-- These columns will store the configuration for the special notifications sent upon purchase completion.

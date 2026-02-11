-- Ensure all notification-related columns exist in site_settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS discord_webhook_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS discord_admin_id text DEFAULT '',
ADD COLUMN IF NOT EXISTS special_discord_webhook_url_1 text DEFAULT '',
ADD COLUMN IF NOT EXISTS special_discord_user_id_1 text DEFAULT '',
ADD COLUMN IF NOT EXISTS special_discord_webhook_url_2 text DEFAULT '',
ADD COLUMN IF NOT EXISTS special_discord_user_id_2 text DEFAULT '';

-- Comments for reference:
-- discord_webhook_url: Webhook for "Order Created" (When user submits details)
-- discord_admin_id: User ID to mention in "Order Created" notification
-- special_discord_webhook_url_1/2: Webhooks for "I Have Paid" (Special notifications)
-- special_discord_user_id_1/2: User IDs to mention in "I Have Paid" notifications

-- Add discord_bot_avatar_url setting
INSERT INTO site_settings (key, value)
VALUES ('discord_bot_avatar_url', '')
ON CONFLICT (key) DO NOTHING;

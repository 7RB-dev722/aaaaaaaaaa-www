-- Add discord_admin_id setting to site_settings table
INSERT INTO site_settings (key, value)
VALUES ('discord_admin_id', '')
ON CONFLICT (key) DO NOTHING;

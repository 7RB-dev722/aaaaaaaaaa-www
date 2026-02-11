-- Update discord_webhook_url setting to ensure it has the correct value
INSERT INTO site_settings (key, value)
VALUES ('discord_webhook_url', 'https://discord.com/api/webhooks/1469962166294806590/oVnra9eTAY3jpVaNH0uXfAOu9bdY7CasnDyVFh0qf5NHSzn5hf1svtZ6Oybcnft1Hnjg')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert default block_vpn setting if it doesn't exist
INSERT INTO site_settings (key, value)
VALUES ('block_vpn', 'false')
ON CONFLICT (key) DO NOTHING;

-- Add ban message settings to site_settings table
-- These settings allow customizing the messages displayed to banned users

INSERT INTO site_settings (key, value) VALUES 
('vpn_ban_message', 'VPN or Proxy usage is detected. Please disable it to access this website.'),
('geo_ban_message', 'Access restricted.'),
('ip_ban_message', 'Your IP address has been banned.'),
('customer_ban_message', 'You are banned from making purchases.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

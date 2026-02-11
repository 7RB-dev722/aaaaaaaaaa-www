
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pbdkxzrzbnlajjgubgis.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZGt4enJ6Ym5sYWpqZ3ViZ2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDMxMDgsImV4cCI6MjA3Njc3OTEwOH0.GwIB_UUBwlrXs2QlHApce_p8IiueQ_x_nUrQp_tjQ3g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['discord_bot_avatar_url', 'site_logo_url', 'discord_webhook_url']);
  
  if (error) console.error(error);
  else console.log(data);
}

checkSettings();

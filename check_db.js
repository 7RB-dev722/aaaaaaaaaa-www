
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'discord_bot_avatar_url');
  
  if (error) console.error(error);
  else console.log(data);
}

checkSettings();

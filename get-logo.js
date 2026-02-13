import { supabase } from './src/lib/supabase.js';

async function getLogo() {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'site_logo_url')
        .single();
    
    if (error) {
        console.error('Error fetching logo:', error);
    } else {
        console.log('LOGO_URL:', data.value);
    }
}

getLogo();

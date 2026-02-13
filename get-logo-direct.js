const supabaseUrl = 'https://pbdkxzrzbnlajjgubgis.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZGt4enJ6Ym5sYWpqZ3ViZ2lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTIwMzEwOCwiZXhwIjoyMDc2Nzc5MTA4fQ.1fEeddMQjNTCpX-oz-gccc4PDdhk7Ly-hw6bHZN-ugI';

async function getLogo() {
    const response = await fetch(`${supabaseUrl}/rest/v1/site_settings?key=eq.site_logo_url&select=*`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    const data = await response.json();
    console.log('LOGO_DATA:', JSON.stringify(data));
}

getLogo();

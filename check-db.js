import { createClient } from '@supabase/supabase-js';

// Credentials from .env
const supabaseUrl = 'https://pbdkxzrzbnlajjgubgis.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZGt4enJ6Ym5sYWpqZ3ViZ2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDMxMDgsImV4cCI6MjA3Njc3OTEwOH0.GwIB_UUBwlrXs2QlHApce_p8IiueQ_x_nUrQp_tjQ3g';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

const tables = [
  'products',
  'categories',
  'winning_photos',
  'site_settings',
  'purchase_images',
  'purchase_intents',
  'invoice_templates',
  'product_keys',
  'local_payment_methods'
];

async function checkConnection() {
  console.log('🔍 Starting Supabase Connection Check...\n');
  
  if (typeof fetch === 'undefined') {
      console.error('❌ fetch is undefined!');
  } else {
      console.log('✅ fetch is available');
  }

  let successCount = 0;
  let failCount = 0;

  for (const table of tables) {
    console.log(`Testing table: ${table}...`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.error(`❌ [${table}]: Failed`);
        console.error(`   Error: ${error.message} (Code: ${error.code})\n`);
        failCount++;
      } else {
        console.log(`✅ [${table}]: Success`);
        console.log(`   Found ${data.length} records (Limit 1)\n`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ [${table}]: Exception`);
      console.error(`   Error: ${err.message}\n`);
      failCount++;
    }
  }

  console.log('--------------------------------------------------');
  console.log(`Summary: ${successCount} Success, ${failCount} Failed`);
  
  if (failCount === 0) {
      console.log('🎉 All database connections are working correctly!');
  } else {
      console.log('⚠️ Some tables are not accessible. Check RLS policies or table existence.');
  }
}

checkConnection();

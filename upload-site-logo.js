import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Credentials
const supabaseUrl = 'https://pbdkxzrzbnlajjgubgis.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZGt4enJ6Ym5sYWpqZ3ViZ2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDMxMDgsImV4cCI6MjA3Njc3OTEwOH0.GwIB_UUBwlrXs2QlHApce_p8IiueQ_x_nUrQp_tjQ3g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadLogo() {
  console.log('🚀 Starting logo upload...');

  const logoPath = path.join(__dirname, 'public', 'cheatloop.jpg');
  
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo file not found at:', logoPath);
    return;
  }

  const fileBuffer = fs.readFileSync(logoPath);
  // Use a unique filename to bypass Discord cache
  const timestamp = Date.now();
  const fileName = `discord-bot-logo-${timestamp}.jpg`;
  const filePath = `discord-avatars/${fileName}`;

  // 1. Upload to Storage
  console.log('Uploading to Supabase Storage...');
  const { data, error } = await supabase.storage
    .from('product-images') // We know this bucket is public
    .upload(filePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error('❌ Upload failed:', error.message);
    return;
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  console.log('✅ Upload successful!');
  console.log('Public URL:', publicUrl);

  // 3. Update Site Settings
  console.log('Updating site_settings...');
  const { error: dbError } = await supabase
    .from('site_settings')
    .upsert({ 
      key: 'discord_bot_avatar_url', 
      value: publicUrl 
    }, { onConflict: 'key' });

  if (dbError) {
    console.error('❌ Database update failed:', dbError.message);
  } else {
    console.log('✅ Database setting updated successfully!');
  }

  return publicUrl;
}

uploadLogo();


import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Manually read .env file
const envPath = path.join(__dirname, '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkKeys() {
  try {
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('id, title')
      .ilike('title', 'Cheatloop Normal')
      .single()

    if (pError) {
      console.error('Error fetching product:', pError)
      return
    }

    console.log(`Product found: ${product.title} (ID: ${product.id})`)

    const { count, error: kError } = await supabase
      .from('product_keys')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', product.id)
      .eq('is_used', false)

    if (kError) {
      console.error('Error fetching keys:', kError)
      return
    }

    console.log(`Available keys for ${product.title}: ${count}`)
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkKeys()

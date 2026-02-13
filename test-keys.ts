
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkKeys() {
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
}

checkKeys()

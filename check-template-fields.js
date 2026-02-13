import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data, error } = await supabase.from('invoice_templates').select('*').limit(1)
  if (error) {
    console.error(error)
  } else {
    console.log('TEMPLATE_FIELDS:', Object.keys(data[0] || {}))
    console.log('TEMPLATE_DATA:', data[0])
  }
}
check()

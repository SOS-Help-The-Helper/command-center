import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CLAWDBOT_WEBHOOK = Deno.env.get('CLAWDBOT_WEBHOOK_URL') || 'http://localhost:3000/webhook'

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const body = await req.json()
    const { lead, action } = body

    if (action === 'qualify') {
      // Store lead in Supabase for processing
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Insert into linkedin_queue table
      const { data, error } = await supabase
        .from('linkedin_queue')
        .insert({
          lead_data: lead,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Insert error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Lead queued for LinkedIn connection',
        id: data?.[0]?.id 
      }), { headers })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
})

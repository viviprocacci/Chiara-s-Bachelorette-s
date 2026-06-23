import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invite_code, pin } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: trip, error } = await supabase
      .from('trips')
      .select('id, name, start_date, end_date, invite_code, default_theme')
      .eq('invite_code', invite_code?.toUpperCase())
      .single()

    if (error || !trip) {
      return new Response(JSON.stringify({ error: 'Invalid invite code' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: fullTrip } = await supabase
      .from('trips')
      .select('pin_hash')
      .eq('id', trip.id)
      .single()

    if (fullTrip?.pin_hash && fullTrip.pin_hash !== pin) {
      return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: members } = await supabase
      .from('trip_members')
      .select('id, display_name, role, avatar_color, auth_uid')
      .eq('trip_id', trip.id)
      .order('display_name')

    return new Response(JSON.stringify({ trip, members }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

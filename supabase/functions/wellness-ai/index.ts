import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data = await req.json()
    
    const { sleep, energy, mood, symptoms, notes } = data
    
    // Build context for Claude
    const moodLabels = ['', 'struggling', 'not great', 'okay', 'good', 'great']
    const symptomsList = symptoms?.length > 0 ? symptoms.join(', ') : 'none reported'
    
    const prompt = `You are a warm, supportive wellness companion for a pregnant woman (around 4-5 weeks along). She just completed a wellness check-in. Respond with gentle, holistic wellness advice and emotional support. Be warm and conversational, not clinical. Keep your response to 2-3 short paragraphs.

Her check-in:
- Sleep quality: ${sleep}/5
- Energy level: ${energy}/5  
- Mood: ${mood}/5 (${moodLabels[mood] || 'not specified'})
- Symptoms: ${symptomsList}
- Her notes: "${notes || 'none'}"

Important guidelines:
- Be supportive and validating, not prescriptive
- Acknowledge her feelings first
- Offer gentle, holistic suggestions (rest, nutrition, self-care) when appropriate
- Never give medical advice - encourage speaking with her doctor for any concerns
- End with something encouraging
- Use a warm, friendly tone like a supportive friend
- Include 1-2 relevant emojis naturally

Respond directly to her (use "you") without any preamble:`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    const result = await response.json()
    const aiResponse = result.content?.[0]?.text || 'Thank you for checking in! Take care of yourself today. 💕'

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        response: 'Thank you for checking in! Your body is doing amazing work. Remember to rest when you need to and be gentle with yourself today. 💕',
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})

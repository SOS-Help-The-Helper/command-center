import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data = await req.json()
    const { sleep, energy, mood, symptoms, notes, checkinType } = data
    
    const moodLabels = ['', 'really struggling', 'not great', 'okay', 'good', 'wonderful']
    const symptomsList = symptoms?.length > 0 ? symptoms.join(', ') : 'none checked'
    const timeOfDay = checkinType === 'morning' ? 'morning' : 'evening'
    
    const prompt = `You are a holistic wellness companion for a pregnant woman in her first trimester. Your approach blends:
- Traditional Chinese Medicine (TCM) principles (qi flow, yin/yang balance, the five elements)
- Ayurvedic wisdom (doshas, digestive fire, seasonal living)
- Naturopathic and herbal traditions
- Mind-body connection and emotional wellness
- Integrative nutrition

She just completed her ${timeOfDay} wellness check-in:

RATINGS:
- Sleep quality: ${sleep}/5
- Energy level: ${energy}/5  
- Mood: ${mood}/5 (${moodLabels[mood] || 'not specified'})
- Symptoms checked: ${symptomsList}

HER WORDS (MOST IMPORTANT - read carefully and respond to what she actually wrote):
"${notes || 'No additional notes'}"

YOUR RESPONSE MUST:
1. **FIRST**: Directly acknowledge and respond to ANYTHING she wrote in her notes. If she mentions sweating, address sweating specifically. If she mentions cravings, food, worries, or ANYTHING - respond to it directly.
2. Offer 1-2 holistic/natural suggestions based on her specific situation (herbal teas, acupressure points, foods that support her symptoms, breathwork, etc.)
3. Frame advice through a holistic lens - mention things like "In TCM..." or "From an Ayurvedic perspective..." when relevant
4. Be warm, supportive, never clinical or preachy
5. Keep it to 2-3 short paragraphs
6. Always remind her to consult her healthcare provider for any medical concerns
7. End with encouragement about her pregnancy journey

EXAMPLES OF HOLISTIC SUGGESTIONS:
- Sweating/hot flashes → "In TCM, this can indicate excess heat or yin deficiency. Try cooling foods like cucumber and watermelon, and peppermint tea."
- Nausea → "Ginger is wonderful - try ginger tea or candied ginger. Acupressure point P6 (inner wrist) can help too."
- Fatigue → "Your body is building new life - honor that. In Ayurveda, this is a time to favor warm, nourishing foods and extra rest."
- Anxiety → "Try 4-7-8 breathing. Rose tea can be calming. In TCM, liver qi stagnation often manifests as anxiety - gentle movement helps."
- Back pain → "Cat-cow stretches are wonderful. A warm (not hot) compress with lavender can soothe. Consider prenatal massage."

DO NOT give generic responses. Read her notes and respond to HER specific experience.

Respond directly to her (use "you"), warmly, like a knowledgeable friend who practices holistic wellness:`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    const result = await response.json()
    const aiResponse = result.content?.[0]?.text || 'Thank you for checking in! Your body is doing sacred work right now. Rest when you need to, nourish yourself with warm foods, and trust your intuition. 💕'

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        response: 'Thank you for checking in, mama! Your body is doing incredible, sacred work. In these early weeks, honor your need for rest and nourishment. Warm ginger tea can be soothing, and remember to breathe deeply. Trust your body\'s wisdom. 💕',
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})

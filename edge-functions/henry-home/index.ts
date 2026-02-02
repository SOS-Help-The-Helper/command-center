/**
 * Henry App Home - Command Center Lite
 * 
 * Deploy to: Supabase Edge Functions, Cloudflare Workers, or Vercel
 * 
 * Triggered by: app_home_opened event from Slack
 * 
 * Set environment variable:
 *   SLACK_BOT_TOKEN = xoxb-your-bot-token
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// For Deno/Supabase Edge Functions:
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const botToken = Deno.env.get("SLACK_BOT_TOKEN");
  if (!botToken) {
    console.error("[henry-home] Missing SLACK_BOT_TOKEN");
    return new Response("Config error", { status: 500 });
  }

  try {
    const body = await req.text();
    
    // Handle URL verification (Slack challenge)
    if (body.includes('"type":"url_verification"')) {
      const data = JSON.parse(body);
      return new Response(JSON.stringify({ challenge: data.challenge }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = JSON.parse(body);
    
    // Handle app_home_opened event
    if (payload.event?.type === "app_home_opened") {
      const userId = payload.event.user;
      console.log(`[henry-home] User ${userId} opened app home`);
      
      await publishHomeTab(botToken, userId);
      
      return new Response("", { status: 200, headers: corsHeaders });
    }

    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("[henry-home] Error:", error);
    return new Response("Error", { status: 200, headers: corsHeaders });
  }
});

async function publishHomeTab(botToken: string, userId: string): Promise<void> {
  const view = buildHomeView();

  const res = await fetch("https://slack.com/api/views.publish", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${botToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: userId,
      view
    })
  });

  const result = await res.json();
  if (!result.ok) {
    console.error("[henry-home] views.publish failed:", result.error);
  }
}

function buildHomeView(): any {
  const now = new Date().toLocaleString("en-US", { 
    timeZone: "America/New_York",
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit"
  });

  return {
    type: "home",
    blocks: [
      // Header
      {
        type: "header",
        text: { type: "plain_text", text: "⚡ Henry Command Center", emoji: true }
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `_Last opened: ${now} EST_` }]
      },
      { type: "divider" },

      // Quick Links
      {
        type: "section",
        text: { type: "mrkdwn", text: "*🔗 Quick Links*" }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📊 Dashboard", emoji: true },
            url: "https://sos-help-the-helper.github.io/command-center/"
          },
          {
            type: "button",
            text: { type: "plain_text", text: "🎯 Grunt Swipe", emoji: true },
            url: "https://sos-help-the-helper.github.io/reforge-swipe/"
          },
          {
            type: "button",
            text: { type: "plain_text", text: "💻 GitHub", emoji: true },
            url: "https://github.com/SOS-Help-The-Helper"
          }
        ]
      },
      { type: "divider" },

      // Urgent Items
      {
        type: "section",
        text: { type: "mrkdwn", text: "*🔥 Urgent Items*" }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "🚨 *Orly/DI Global* - 13 weeks overdue, decide: deliver or refund\n🚨 *Hubert Group* - Invoice PAST DUE\n🟡 *InventWood* - Confirm next week's NetSuite call\n🟡 *Endurant* - Reschedule canceled meeting"
        }
      },
      { type: "divider" },

      // Pipeline Snapshot
      {
        type: "section",
        text: { type: "mrkdwn", text: "*💰 Pipeline Snapshot*" }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: "*Reforge Active*\n$311K" },
          { type: "mrkdwn", text: "*Hot Deal*\nEvenUp $35K 🔥" },
          { type: "mrkdwn", text: "*Watch*\nNeo Financial ⚠️" },
          { type: "mrkdwn", text: "*Won 2025*\n$50K" }
        ]
      },
      { type: "divider" },

      // Intel Agents
      {
        type: "section",
        text: { type: "mrkdwn", text: "*📡 Intel Agents (Active)*" }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "✅ *Reforge* - 9am, 12pm, 5pm EST (M-F)\n✅ *SOS* - 10am, 6pm EST (Daily)\n✅ *Harmony* - 11am EST (M-F)\n✅ *Morning Brief* - 9am EST (Daily)"
        }
      },
      { type: "divider" },

      // Key Dates
      {
        type: "section",
        text: { type: "mrkdwn", text: "*📅 Key Dates*" }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• *Mar 3* - EDA Grant deadline\n• *TBD* - InventWood NetSuite call"
        }
      },
      { type: "divider" },

      // Footer
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "💬 _Just message me! \"Check email\" • \"What's urgent?\" • \"Run intel on [company]\"_"
          }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📄 Henry Overview", emoji: true },
            url: "https://sos-help-the-helper.github.io/command-center/henry.html"
          }
        ]
      }
    ]
  };
}

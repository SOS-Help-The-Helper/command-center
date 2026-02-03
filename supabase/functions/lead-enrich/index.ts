// Lead Enrichment Edge Function
// Proxies requests to Apollo API for company/person enrichment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY") || "";
const APOLLO_BASE_URL = "https://api.apollo.io/api/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EnrichRequest {
  domain?: string;
  linkedin_url?: string;
  company_name?: string;
}

interface ICPScore {
  total: number;
  breakdown: {
    factor: string;
    points: number;
    reason: string;
  }[];
  recommendation: string;
}

function calculateICPScore(company: any): ICPScore {
  const breakdown: { factor: string; points: number; reason: string }[] = [];
  let total = 50; // Base score

  // Company size scoring (51-500 employees: +20 points)
  const employeeCount = company.estimated_num_employees || company.employee_count || 0;
  if (employeeCount >= 51 && employeeCount <= 500) {
    breakdown.push({ factor: "Company Size", points: 20, reason: `${employeeCount} employees (sweet spot)` });
    total += 20;
  } else if (employeeCount > 500 && employeeCount <= 2000) {
    breakdown.push({ factor: "Company Size", points: 15, reason: `${employeeCount} employees (larger org)` });
    total += 15;
  } else if (employeeCount > 2000) {
    breakdown.push({ factor: "Company Size", points: 5, reason: `${employeeCount} employees (enterprise)` });
    total += 5;
  } else if (employeeCount > 0 && employeeCount < 51) {
    breakdown.push({ factor: "Company Size", points: -5, reason: `${employeeCount} employees (too small)` });
    total -= 5;
  }

  // Industry scoring - B2B SaaS: +20 points
  const industry = (company.industry || "").toLowerCase();
  const keywords = company.keywords || [];
  const keywordsLower = keywords.map((k: string) => k.toLowerCase());
  
  const b2bSaasIndicators = ["software", "saas", "technology", "internet", "computer software", "information technology"];
  const isB2BSaas = b2bSaasIndicators.some(ind => industry.includes(ind)) || 
                    keywordsLower.some((k: string) => k.includes("saas") || k.includes("b2b"));
  
  if (isB2BSaas) {
    breakdown.push({ factor: "B2B SaaS", points: 20, reason: `Industry: ${company.industry || 'Tech/Software'}` });
    total += 20;
  }

  // AI tools in stack: +15 points
  const techStack = company.technology_names || company.technologies || [];
  const techStackLower = techStack.map((t: string) => t.toLowerCase());
  const aiTools = ["openai", "github copilot", "copilot", "anthropic", "claude", "gpt", "cursor", "chatgpt", "ai", "machine learning", "tensorflow", "pytorch"];
  const hasAITools = techStackLower.some((t: string) => aiTools.some(ai => t.includes(ai)));
  
  if (hasAITools) {
    const aiFound = techStack.filter((t: string) => aiTools.some(ai => t.toLowerCase().includes(ai)));
    breakdown.push({ factor: "AI Tools", points: 15, reason: `Uses: ${aiFound.slice(0, 3).join(", ")}` });
    total += 15;
  }

  // Recent funding: +10 points
  const fundingStage = company.latest_funding_stage || company.funding_stage || "";
  const totalFunding = company.total_funding || company.funding || 0;
  const recentFundingIndicators = ["series a", "series b", "series c", "series d", "seed"];
  const hasRecentFunding = recentFundingIndicators.some(f => fundingStage.toLowerCase().includes(f));
  
  if (hasRecentFunding || totalFunding > 10000000) {
    const fundingStr = totalFunding > 0 ? `$${(totalFunding / 1000000).toFixed(1)}M raised` : fundingStage;
    breakdown.push({ factor: "Recent Funding", points: 10, reason: fundingStr });
    total += 10;
  }

  // Product-led growth indicators: +15 points
  const plgKeywords = ["product-led", "self-serve", "freemium", "free trial", "plg", "product led"];
  const description = (company.short_description || company.description || "").toLowerCase();
  const isPLG = plgKeywords.some(k => description.includes(k)) || 
                keywordsLower.some((k: string) => plgKeywords.some(p => k.includes(p)));
  
  if (isPLG) {
    breakdown.push({ factor: "Product-Led", points: 15, reason: "PLG indicators found" });
    total += 15;
  }

  // Negative: Mobile-first/Hardware: -20 points
  const negativeIndicators = ["mobile app", "mobile-first", "hardware", "iot", "consumer electronics", "gaming", "games"];
  const isNegative = negativeIndicators.some(n => industry.includes(n) || description.includes(n));
  
  if (isNegative) {
    breakdown.push({ factor: "Mobile/Hardware", points: -20, reason: "Not ideal ICP segment" });
    total -= 20;
  }

  // Cap score between 0 and 100
  total = Math.max(0, Math.min(100, total));

  // Generate recommendation
  let recommendation: string;
  if (total >= 85) {
    recommendation = "🔥 HOT LEAD - Prioritize outreach immediately";
  } else if (total >= 70) {
    recommendation = "✅ QUALIFIED - Good fit, proceed with outreach";
  } else if (total >= 50) {
    recommendation = "🟡 MAYBE - Research more before reaching out";
  } else {
    recommendation = "❌ SKIP - Poor ICP fit, deprioritize";
  }

  return { total, breakdown, recommendation };
}

async function enrichOrganization(request: EnrichRequest) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "X-Api-Key": APOLLO_API_KEY,
  };

  // Try organization enrich by domain first
  if (request.domain) {
    const response = await fetch(`${APOLLO_BASE_URL}/organizations/enrich`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        domain: request.domain,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.organization) {
        return data.organization;
      }
    }
  }

  // Fallback: search by company name
  if (request.company_name) {
    const response = await fetch(`${APOLLO_BASE_URL}/mixed_companies/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        q_organization_name: request.company_name,
        per_page: 1,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.organizations && data.organizations.length > 0) {
        return data.organizations[0];
      }
    }
  }

  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EnrichRequest = await req.json();
    
    // Extract domain from URL if provided
    let domain = body.domain;
    if (domain && domain.includes("://")) {
      try {
        const url = new URL(domain);
        domain = url.hostname.replace("www.", "");
      } catch {
        // Keep as-is if not a valid URL
      }
    }

    // Extract company name from LinkedIn URL if provided
    let companyName = body.company_name;
    if (body.linkedin_url && !companyName) {
      const match = body.linkedin_url.match(/linkedin\.com\/company\/([^\/\?]+)/);
      if (match) {
        companyName = match[1].replace(/-/g, " ");
      }
    }

    const enrichRequest: EnrichRequest = {
      domain,
      company_name: companyName,
      linkedin_url: body.linkedin_url,
    };

    // Enrich via Apollo
    const company = await enrichOrganization(enrichRequest);

    if (!company) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Company not found in Apollo. Try a different domain or company name.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate ICP score
    const icpScore = calculateICPScore(company);

    // Build response
    const result = {
      success: true,
      company: {
        name: company.name,
        domain: company.primary_domain || company.domain,
        linkedin_url: company.linkedin_url,
        logo_url: company.logo_url,
        industry: company.industry,
        employee_count: company.estimated_num_employees || company.employee_count,
        employee_range: company.employee_range,
        founded_year: company.founded_year,
        short_description: company.short_description,
        funding_stage: company.latest_funding_stage,
        total_funding: company.total_funding,
        technologies: company.technology_names || [],
        keywords: company.keywords || [],
        location: {
          city: company.city,
          state: company.state,
          country: company.country,
        },
        seo_description: company.seo_description,
      },
      icp_score: icpScore,
      raw_data: company, // Include for debugging
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

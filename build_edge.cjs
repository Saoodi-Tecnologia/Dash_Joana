const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const analyticsPath = path.join(srcDir, 'services', 'analyticsEngine.ts');
const geminiPath = path.join(srcDir, 'services', 'geminiService.ts');
const typesPath = path.join(srcDir, 'types', 'dashboard.ts');

let analyticsCode = fs.readFileSync(analyticsPath, 'utf8');
let geminiCode = fs.readFileSync(geminiPath, 'utf8');
let typesCode = fs.readFileSync(typesPath, 'utf8');

// Strip local imports
analyticsCode = analyticsCode
    .replace(/import { supabase } from '\.\.\/integrations\/supabase\/client';/g, '')
    .replace(/import { geminiService } from '\.\/geminiService';/g, '')
    .replace(/import type {.*? } from '@\/types\/dashboard';/g, '');

geminiCode = geminiCode
    .replace(/import { GoogleGenerativeAI } from '@google\/generative-ai';/g, '')
    .replace(/export const geminiService = new GeminiService\(\);/g, 'const geminiService = new GeminiService();');

// Convert string replacements for Edge environment
geminiCode = geminiCode.replace(
    /import\.meta\.env\.VITE_GEMINI_API_KEY/g,
    "Deno.env.get('GEMINI_API_KEY')"
);

// We must also handle localStorage usage in analyticsEngine for insights
// In Deno edge functions, localStorage doesn't exist. We can comment out the cache logic or use a simple memory cache.
analyticsCode = analyticsCode.replace(/localStorage\.getItem.*?;/g, 'null;');
analyticsCode = analyticsCode.replace(/localStorage\.removeItem.*?;/g, '');
analyticsCode = analyticsCode.replace(/localStorage\.setItem[\s\S]*?\}\)\);/g, '');

// Assemble edge function code
const edgeCode = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- TYPES ---
${typesCode.replace(/export /g, '')}

// --- GEMINI SERVICE ---
${geminiCode}

// --- SUPABASE CLIENT INSTANCE FOR THIS REQUEST ---
let supabase: any;

// --- ANALYTICS ENGINE ---
${analyticsCode.replace(/export class AnalyticsEngine/g, 'class AnalyticsEngine')
    .replace(/export const analyticsEngine.*/g, '')}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    // Alternatively, to bypass RLS and read all hidden messages, we USE SERVICE_ROLE_KEY!
    // As per user requirement: "Puxa os telefones com Chave Super Secreta Oculta"
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { forceRefetch, startDate, endDate, generateInsights } = await req.json().catch(() => ({}));
    
    const engine = new AnalyticsEngine();
    
    if (generateInsights) {
        const insights = await engine.generateWeeklyInsights();
        return new Response(JSON.stringify(insights), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    // Calculate metrics securely on the server
    const metrics = await engine.fetchAndAnalyze(forceRefetch, start, end);

    // Filter raw messages to ensure no phones/data leaks? They are not returned anyway!
    // Result only contains 'metrics' which are aggregated!

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
`;

fs.mkdirSync(path.join(__dirname, 'supabase', 'functions', 'get-dashboard-metrics'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'supabase', 'functions', 'get-dashboard-metrics', 'index.ts'), edgeCode);
console.log('Edge function built successfully.');

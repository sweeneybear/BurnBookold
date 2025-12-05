// BurnBook - Natural Language Query Edge Function
// Supabase Edge Function for answering natural language questions about sentiment data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT') || '';
const AZURE_OPENAI_KEY = Deno.env.get('AZURE_OPENAI_KEY') || '';
const AZURE_OPENAI_DEPLOYMENT = Deno.env.get('AZURE_OPENAI_DEPLOYMENT') || 'gpt-4';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryRequest {
  question: string;
  entityType?: 'company' | 'product' | 'feature';
  entityName?: string;
}

interface SentimentSummaryItem {
  entity_name: string;
  entity_type: string;
  total_mentions: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  mixed_count: number;
  avg_sentiment_score: number;
}

interface PostContext {
  post: { title?: string; body?: string };
  entity: { name?: string };
  sentiment: string;
}

interface ContextData {
  posts: PostContext[];
  summary: SentimentSummaryItem[];
}

/**
 * Get relevant context from the database based on the question
 */
async function getRelevantContext(
  supabase: SupabaseClient,
  _question: string,
  entityType?: string,
  entityName?: string
): Promise<ContextData> {
  // Get sentiment summary
  let summaryQuery = supabase.from('sentiment_summary').select('*');
  
  if (entityType) {
    summaryQuery = summaryQuery.eq('entity_type', entityType);
  }
  if (entityName) {
    summaryQuery = summaryQuery.ilike('entity_name', `%${entityName}%`);
  }

  const { data: summaryData } = await summaryQuery;

  // Get recent posts with sentiment
  const postsQuery = supabase
    .from('sentiment_analysis')
    .select(`
      sentiment,
      sentiment_score,
      confidence,
      key_phrases,
      post:reddit_posts(id, title, body, subreddit, created_utc),
      entity:entities!inner(name, entity_type)
    `)
    .order('analyzed_at', { ascending: false })
    .limit(20);

  // Note: Supabase filtering on joined tables requires the !inner modifier
  // The entityType filter is applied on the summary query instead for reliability

  const { data: postsData } = await postsQuery;

  return {
    posts: postsData || [],
    summary: summaryData || [],
  };
}

/**
 * Generate answer using Azure OpenAI
 */
async function generateAnswer(
  question: string,
  context: ContextData
): Promise<string> {
  // If Azure OpenAI is not configured, use mock response
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    return generateMockAnswer(question, context);
  }

  const endpoint = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`;

  // Build context string
  const contextStr = context.posts.map((p: PostContext) => {
    const post = p.post;
    const entity = p.entity;
    return `- [${p.sentiment}] ${entity?.name || 'Unknown'}: "${post?.title || ''} ${post?.body?.slice(0, 200) || ''}"`;
  }).join('\n');

  const summaryStr = context.summary.map((s: SentimentSummaryItem) => 
    `${s.entity_name} (${s.entity_type}): ${s.total_mentions} mentions, ${s.positive_count} positive, ${s.negative_count} negative`
  ).join('\n');

  const systemPrompt = `You are a helpful product manager assistant analyzing Reddit sentiment data. 
You have access to sentiment analysis results from Reddit posts about a company's products and features.
Answer questions based on the provided context. Be concise and actionable.
If you don't have enough data to answer, say so.`;

  const userPrompt = `Question: ${question}

Sentiment Summary:
${summaryStr || 'No summary data available'}

Recent Posts:
${contextStr || 'No posts available'}

Please provide a concise answer with actionable insights for a product manager.`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'api-key': AZURE_OPENAI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Azure OpenAI error:', await response.text());
      return generateMockAnswer(question, context);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || generateMockAnswer(question, context);
  } catch (error) {
    console.error('Azure OpenAI request failed:', error);
    return generateMockAnswer(question, context);
  }
}

/**
 * Generate mock answer for demo/development
 */
function generateMockAnswer(_question: string, context: ContextData): string {
  const lowerQuestion = _question.toLowerCase();
  
  // Calculate overall sentiment
  let totalPositive = 0;
  let totalNegative = 0;
  let totalMentions = 0;

  for (const s of context.summary) {
    totalPositive += s.positive_count || 0;
    totalNegative += s.negative_count || 0;
    totalMentions += s.total_mentions || 0;
  }

  const positivePercent = totalMentions > 0 ? Math.round((totalPositive / totalMentions) * 100) : 0;
  const negativePercent = totalMentions > 0 ? Math.round((totalNegative / totalMentions) * 100) : 0;

  // Generate contextual responses based on question keywords
  if (lowerQuestion.includes('sentiment') || lowerQuestion.includes('feel') || lowerQuestion.includes('think')) {
    return `Based on the analyzed Reddit posts, the overall sentiment is ${positivePercent > negativePercent ? 'mostly positive' : 'mixed'}. 

**Key Insights:**
- ${positivePercent}% of mentions are positive
- ${negativePercent}% of mentions are negative
- Total mentions analyzed: ${totalMentions}

**Recommendations:**
${positivePercent > 60 ? 
  '✅ Users are generally satisfied. Continue current direction and consider highlighting these positive aspects in marketing.' :
  '⚠️ There are opportunities for improvement. Consider addressing the negative feedback themes in your next sprint.'}`;
  }

  if (lowerQuestion.includes('feature') || lowerQuestion.includes('request')) {
    const featureSummary = context.summary.filter((s: SentimentSummaryItem) => s.entity_type === 'feature');
    if (featureSummary.length > 0) {
      return `Based on Reddit discussions, here are the feature-related insights:

**Most Discussed Features:**
${featureSummary.map((f: SentimentSummaryItem) => `- ${f.entity_name}: ${f.total_mentions} mentions (${f.positive_count} positive, ${f.negative_count} negative)`).join('\n')}

**Recommendation:** Focus on improving features with high mention counts but lower positive ratios.`;
    }
  }

  if (lowerQuestion.includes('product') || lowerQuestion.includes('compare')) {
    const productSummary = context.summary.filter((s: SentimentSummaryItem) => s.entity_type === 'product');
    if (productSummary.length > 0) {
      return `**Product Sentiment Analysis:**

${productSummary.map((p: SentimentSummaryItem) => {
  const score = p.avg_sentiment_score ? (p.avg_sentiment_score * 100).toFixed(0) : 'N/A';
  return `**${p.entity_name}:** ${p.total_mentions} mentions, sentiment score: ${score}%`;
}).join('\n')}

**Key Takeaway:** ${productSummary[0]?.entity_name || 'Products'} has the most engagement. Monitor trends over time for actionable insights.`;
    }
  }

  // Default response
  return `Based on ${totalMentions} analyzed Reddit posts:

**Sentiment Overview:**
- Positive: ${positivePercent}%
- Negative: ${negativePercent}%
- Neutral: ${100 - positivePercent - negativePercent}%

**Top Entities Discussed:**
${context.summary.slice(0, 3).map((s: SentimentSummaryItem) => `- ${s.entity_name} (${s.entity_type}): ${s.total_mentions} mentions`).join('\n')}

For more specific insights, try asking about:
- "What do users think about [specific feature]?"
- "Compare sentiment across products"
- "What features are users requesting?"`;
}

/**
 * Main request handler
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const body: QueryRequest = await req.json();
    
    if (!body.question) {
      return new Response(
        JSON.stringify({ error: 'Please provide a question' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get relevant context
    const context = await getRelevantContext(
      supabase,
      body.question,
      body.entityType,
      body.entityName
    );

    // Generate answer
    const answer = await generateAnswer(body.question, context);

    // Calculate summary stats
    let totalMentions = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const s of context.summary) {
      totalMentions += s.total_mentions || 0;
      positiveCount += s.positive_count || 0;
      negativeCount += s.negative_count || 0;
      neutralCount += s.neutral_count || 0;
    }

    // Format sources
    const sources = context.posts.slice(0, 5).map((p: PostContext) => ({
      postId: p.post?.title, // Using title as identifier since it's in the context
      title: p.post?.title,
      snippet: (p.post?.body?.slice(0, 150) || '') + '...',
      sentiment: p.sentiment,
    }));

    const responseTime = Date.now() - startTime;

    // Save query to history
    await supabase.from('nl_queries').insert({
      question: body.question,
      answer: answer,
      response_time_ms: responseTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        sources,
        summary: {
          totalMentions,
          positivePercent: totalMentions > 0 ? Math.round((positiveCount / totalMentions) * 100) : 0,
          negativePercent: totalMentions > 0 ? Math.round((negativeCount / totalMentions) * 100) : 0,
          neutralPercent: totalMentions > 0 ? Math.round((neutralCount / totalMentions) * 100) : 0,
        },
        responseTimeMs: responseTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// BurnBook - Azure AI Sentiment Analysis Edge Function
// Supabase Edge Function for analyzing Reddit posts using Azure AI Language services

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables (set in Supabase dashboard)
const AZURE_AI_ENDPOINT = Deno.env.get('AZURE_AI_ENDPOINT') || '';
const AZURE_AI_KEY = Deno.env.get('AZURE_AI_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedditPost {
  id: string;
  title?: string;
  body?: string;
  subreddit: string;
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  sentimentScore: number;
  keyPhrases: string[];
  entities: Array<{
    name: string;
    type: string;
    confidence: number;
  }>;
}

interface RequestBody {
  url?: string;
  text?: string;
  postId?: string;
}

/**
 * Fetch Reddit post data from URL
 * Uses Reddit's JSON API endpoint with rate limit handling
 */
async function fetchRedditData(url: string, retryCount = 0): Promise<RedditPost[]> {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second
  
  // Convert Reddit URL to JSON endpoint
  const jsonUrl = url.replace(/\/?$/, '.json');
  
  const response = await fetch(jsonUrl, {
    headers: {
      'User-Agent': 'BurnBook/1.0 (Sentiment Analysis Tool)',
    },
  });

  // Handle rate limiting with exponential backoff
  if (response.status === 429) {
    if (retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      console.warn(`Rate limited by Reddit API. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchRedditData(url, retryCount + 1);
    }
    throw new Error('Reddit API rate limit exceeded. Please try again later.');
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch Reddit data: ${response.statusText}`);
  }

  const data = await response.json();
  const posts: RedditPost[] = [];

  // Parse Reddit listing response
  if (Array.isArray(data)) {
    // Post with comments
    for (const listing of data) {
      if (listing.data?.children) {
        for (const child of listing.data.children) {
          if (child.kind === 't3' || child.kind === 't1') {
            posts.push({
              id: child.data.id,
              title: child.data.title,
              body: child.data.selftext || child.data.body,
              subreddit: child.data.subreddit,
            });
          }
        }
      }
    }
  } else if (data.data?.children) {
    // Subreddit listing
    for (const child of data.data.children) {
      posts.push({
        id: child.data.id,
        title: child.data.title,
        body: child.data.selftext,
        subreddit: child.data.subreddit,
      });
    }
  }

  return posts;
}

/**
 * Analyze text sentiment using Azure AI Language services or Azure OpenAI
 */
async function analyzeSentiment(text: string): Promise<SentimentResult> {
  // If Azure AI is not configured, return mock data for demo
  if (!AZURE_AI_ENDPOINT || !AZURE_AI_KEY) {
    console.warn('Azure AI not configured, returning mock sentiment');
    return mockSentimentAnalysis(text);
  }

  try {
    // Try using Azure AI Foundry (text analytics API)
    // The endpoint should be in format: https://region.api.cognitive.microsoft.com or 
    // Azure AI Foundry format: https://eus1-c-oai-01.services.ai.azure.com/api/projects/...
    
    let endpoint = AZURE_AI_ENDPOINT;
    
    // Normalize the endpoint
    if (!endpoint.includes(':analyze-text')) {
      // If it's an Azure AI Foundry endpoint, append the language analysis path
      endpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
      endpoint += 'language/:analyze-text?api-version=2023-04-01';
    }

    console.log('Using Azure AI endpoint for sentiment analysis');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_AI_KEY,
        'api-key': AZURE_AI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'SentimentAnalysis',
        analysisInput: {
          documents: [
            {
              id: '1',
              language: 'en',
              text: text.substring(0, 5120), // Azure limit is 5120 chars
            },
          ],
        },
        parameters: {
          opinionMining: true,
          stringIndexType: 'TextElements_v8',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Azure AI error (${response.status}):`, errorText);
      console.warn('Falling back to mock sentiment analysis');
      return mockSentimentAnalysis(text);
    }

    const result = await response.json();
    const doc = result.results?.documents?.[0];

    if (!doc) {
      console.warn('No sentiment results from Azure AI');
      return mockSentimentAnalysis(text);
    }

    // Map Azure sentiment to our format
    const sentimentMap: Record<string, 'positive' | 'negative' | 'neutral' | 'mixed'> = {
      positive: 'positive',
      negative: 'negative',
      neutral: 'neutral',
      mixed: 'mixed',
    };

    // Calculate sentiment score (-1 to 1)
    const scores = doc.confidenceScores;
    const sentimentScore = (scores.positive || 0) - (scores.negative || 0);

    console.log(`Azure AI sentiment for text: ${doc.sentiment} (confidence: ${Math.max(...Object.values(scores as Record<string, number>))})`);

    return {
      sentiment: sentimentMap[doc.sentiment] || 'neutral',
      confidence: Math.max(...Object.values(scores as Record<string, number>)),
      sentimentScore,
      keyPhrases: [],
      entities: [],
    };
  } catch (error) {
    console.error('Azure AI request failed:', error);
    console.warn('Falling back to mock sentiment analysis');
    return mockSentimentAnalysis(text);
  }
}

/**
 * Extract key phrases using Azure AI
 */
async function extractKeyPhrases(text: string): Promise<string[]> {
  if (!AZURE_AI_ENDPOINT || !AZURE_AI_KEY) {
    return extractMockKeyPhrases(text);
  }

  let endpoint = AZURE_AI_ENDPOINT;
  
  // Normalize the endpoint
  if (!endpoint.includes(':analyze-text')) {
    endpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
    endpoint += 'language/:analyze-text?api-version=2023-04-01';
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_AI_KEY,
        'api-key': AZURE_AI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'KeyPhraseExtraction',
        analysisInput: {
          documents: [
            {
              id: '1',
              language: 'en',
              text: text.substring(0, 5120), // Azure limit
            },
          ],
        },
        parameters: {
          modelVersion: 'latest',
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Key phrase extraction failed (${response.status}), using mock`);
      return extractMockKeyPhrases(text);
    }

    const result = await response.json();
    const phrases = result.results?.documents?.[0]?.keyPhrases || [];
    
    if (phrases.length > 0) {
      console.log(`Extracted ${phrases.length} key phrases using Azure AI`);
      return phrases;
    }
    
    return extractMockKeyPhrases(text);
  } catch (error) {
    console.error('Key phrase extraction failed:', error);
    return extractMockKeyPhrases(text);
  }
}

interface AzureEntity {
  text: string;
  category: string;
  confidenceScore: number;
}

/**
 * Extract named entities using Azure AI
 */
async function extractEntities(text: string): Promise<Array<{ name: string; type: string; confidence: number }>> {
  if (!AZURE_AI_ENDPOINT || !AZURE_AI_KEY) {
    return extractMockEntities(text);
  }

  let endpoint = AZURE_AI_ENDPOINT;
  
  // Normalize the endpoint
  if (!endpoint.includes(':analyze-text')) {
    endpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
    endpoint += 'language/:analyze-text?api-version=2023-04-01';
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_AI_KEY,
        'api-key': AZURE_AI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'EntityRecognition',
        analysisInput: {
          documents: [
            {
              id: '1',
              language: 'en',
              text: text.substring(0, 5120), // Azure limit
            },
          ],
        },
        parameters: {
          modelVersion: 'latest',
          stringIndexType: 'TextElements_v8',
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Entity extraction failed (${response.status}), using mock`);
      return extractMockEntities(text);
    }

    const result = await response.json();
    const entities = result.results?.documents?.[0]?.entities || [];
    
    if (entities.length > 0) {
      console.log(`Extracted ${entities.length} entities using Azure AI`);
      return entities.map((e: AzureEntity) => ({
        name: e.text,
        type: e.category,
        confidence: e.confidenceScore,
      }));
    }
    
    return extractMockEntities(text);
        },
      }),
    });

    if (!response.ok) {
      return extractMockEntities(text);
    }

    const result = await response.json();
    const entities = result.results?.documents?.[0]?.entities || [];
    
    return entities.map((e: AzureEntity) => ({
      name: e.text,
      type: e.category,
      confidence: e.confidenceScore,
    }));
  } catch (error) {
    console.error('Entity extraction failed:', error);
    return extractMockEntities(text);
  }
}

/**
 * Mock sentiment analysis for demo/development
 */
function mockSentimentAnalysis(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  
  // Simple keyword-based sentiment detection
  const positiveWords = ['great', 'awesome', 'love', 'excellent', 'amazing', 'helpful', 'works', 'good', 'best', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'problem', 'issue', 'bug', 'broken', 'worst', 'useless'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  for (const word of positiveWords) {
    if (lowerText.includes(word)) positiveScore += 0.2;
  }
  
  for (const word of negativeWords) {
    if (lowerText.includes(word)) negativeScore += 0.2;
  }
  
  positiveScore = Math.min(positiveScore, 1);
  negativeScore = Math.min(negativeScore, 1);
  
  let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  if (positiveScore > 0.3 && negativeScore > 0.3) {
    sentiment = 'mixed';
  } else if (positiveScore > negativeScore + 0.2) {
    sentiment = 'positive';
  } else if (negativeScore > positiveScore + 0.2) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }
  
  return {
    sentiment,
    confidence: Math.max(positiveScore, negativeScore, 0.5),
    sentimentScore: positiveScore - negativeScore,
    keyPhrases: extractMockKeyPhrases(text),
    entities: extractMockEntities(text),
  };
}

/**
 * Mock key phrase extraction for demo
 */
function extractMockKeyPhrases(text: string): string[] {
  // Simple extraction based on common patterns
  const phrases: string[] = [];
  const words = text.split(/\s+/);
  
  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 4 && words[i + 1].length > 4) {
      phrases.push(`${words[i]} ${words[i + 1]}`.toLowerCase());
    }
  }
  
  return phrases.slice(0, 5);
}

/**
 * Mock entity extraction for demo
 */
function extractMockEntities(text: string): Array<{ name: string; type: string; confidence: number }> {
  const entities: Array<{ name: string; type: string; confidence: number }> = [];
  const lowerText = text.toLowerCase();
  
  // Check for known entities
  const knownEntities = [
    { name: 'ImageTrend', type: 'company', keywords: ['imagetrend', 'image trend'] },
    { name: 'Elite', type: 'product', keywords: ['elite', 'elite epcr'] },
    { name: 'RescueHub', type: 'product', keywords: ['rescuehub', 'rescue hub'] },
    { name: 'Mobile App', type: 'feature', keywords: ['mobile app', 'app', 'mobile'] },
    { name: 'Offline Mode', type: 'feature', keywords: ['offline', 'offline mode'] },
    { name: 'CAD Integration', type: 'feature', keywords: ['cad', 'dispatch'] },
    { name: 'Reporting', type: 'feature', keywords: ['reporting', 'reports', 'analytics'] },
  ];
  
  for (const entity of knownEntities) {
    for (const keyword of entity.keywords) {
      if (lowerText.includes(keyword)) {
        entities.push({
          name: entity.name,
          type: entity.type,
          confidence: 0.85,
        });
        break;
      }
    }
  }
  
  return entities;
}

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Save analysis results to Supabase
 */
async function saveResults(
  supabase: SupabaseClient,
  post: RedditPost,
  sentiment: SentimentResult
): Promise<void> {
  // Insert or update Reddit post
  const { data: postData, error: postError } = await supabase
    .from('reddit_posts')
    .upsert({
      reddit_id: post.id,
      subreddit: post.subreddit,
      title: post.title,
      body: post.body,
      url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
      post_type: post.title ? 'post' : 'comment',
    }, { onConflict: 'reddit_id' })
    .select('id')
    .single();

  if (postError) {
    console.error('Error saving post:', postError);
    return;
  }

  // For each detected entity, create sentiment analysis entry
  for (const entity of sentiment.entities) {
    // Normalize entity name: lowercase, remove special chars, replace spaces with underscores
    const normalizedName = entity.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '_'); // Replace spaces with underscores
    
    // Skip empty normalized names
    if (!normalizedName) {
      console.warn(`Skipping entity with empty normalized name: ${entity.name}`);
      continue;
    }
    
    // Find or create entity
    const { data: entityData, error: entityError } = await supabase
      .from('entities')
      .upsert({
        name: entity.name,
        normalized_name: normalizedName,
        entity_type: entity.type,
      }, { onConflict: 'normalized_name,entity_type' })
      .select('id')
      .single();

    if (entityError) {
      console.error('Error saving entity:', entityError);
      continue;
    }

    // Save sentiment analysis
    await supabase
      .from('sentiment_analysis')
      .upsert({
        post_id: postData.id,
        entity_id: entityData.id,
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence,
        sentiment_score: sentiment.sentimentScore,
        key_phrases: sentiment.keyPhrases,
      }, { onConflict: 'post_id,entity_id' });
  }
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
    const body: RequestBody = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Case 1: Analyze from Reddit URL
    if (body.url) {
      // Create ingestion job
      const { data: job, error: jobError } = await supabase
        .from('ingestion_jobs')
        .insert({
          url: body.url,
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      try {
        // Fetch Reddit data
        const posts = await fetchRedditData(body.url);
        
        if (!posts || posts.length === 0) {
          throw new Error('No posts found at the provided Reddit URL');
        }
        
        // Update job with post count
        await supabase
          .from('ingestion_jobs')
          .update({ posts_found: posts.length })
          .eq('id', job.id);

        // Analyze each post
        let analyzed = 0;
        const results = [];

        for (const post of posts) {
          const textToAnalyze = [post.title, post.body].filter(Boolean).join(' ');
          
          if (textToAnalyze.trim().length < 10) continue;

          try {
            const sentiment = await analyzeSentiment(textToAnalyze);
            sentiment.keyPhrases = await extractKeyPhrases(textToAnalyze);
            sentiment.entities = await extractEntities(textToAnalyze);

            await saveResults(supabase, post, sentiment);
            
            results.push({
              postId: post.id,
              sentiment: sentiment.sentiment,
              confidence: sentiment.confidence,
              entities: sentiment.entities.map(e => e.name),
            });

            analyzed++;
          } catch (postError) {
            console.error(`Failed to analyze post ${post.id}:`, postError);
            // Continue with next post
            continue;
          }
          
          // Update progress
          await supabase
            .from('ingestion_jobs')
            .update({ posts_analyzed: analyzed })
            .eq('id', job.id);
        }

        // Mark job as completed
        await supabase
          .from('ingestion_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        // Refresh materialized view (non-blocking - don't fail if this fails)
        try {
          await supabase.rpc('refresh_sentiment_summary');
        } catch (refreshError) {
          console.warn('Failed to refresh sentiment summary:', refreshError);
          // Continue anyway - the data is still valid, just not aggregated
        }

        return new Response(
          JSON.stringify({
            success: true,
            jobId: job.id,
            postsFound: posts.length,
            postsAnalyzed: analyzed,
            results,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        // Mark job as failed
        await supabase
          .from('ingestion_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        throw error;
      }
    }

    // Case 2: Analyze raw text
    if (body.text) {
      const sentiment = await analyzeSentiment(body.text);
      sentiment.keyPhrases = await extractKeyPhrases(body.text);
      sentiment.entities = await extractEntities(body.text);

      return new Response(
        JSON.stringify({
          success: true,
          sentiment: sentiment.sentiment,
          confidence: sentiment.confidence,
          sentimentScore: sentiment.sentimentScore,
          keyPhrases: sentiment.keyPhrases,
          entities: sentiment.entities,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Please provide either a url or text to analyze' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in edge function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: 'Check function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

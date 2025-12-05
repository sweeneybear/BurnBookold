// BurnBook - Azure AI Client Utilities
// Client-side utilities for Azure AI integration

import { invokeFunction } from './supabase';
import type { 
  AnalyzeSentimentResponse,
  NLQueryRequest,
  NLQueryResponse 
} from '../types';

/**
 * Analyze sentiment from a Reddit URL
 * Invokes the analyze-sentiment edge function
 */
export const analyzeRedditUrl = async (
  url: string
): Promise<AnalyzeSentimentResponse> => {
  // Try invoking the Supabase edge function first. If it fails (function not deployed
  // or network error), fall back to a local, client-side analysis so the prototype
  // remains usable without server-side deployment.
  try {
    const { data, error } = await invokeFunction<AnalyzeSentimentResponse>(
      'analyze-sentiment',
      { url }
    );

    if (error) {
      // If the edge function returned an error, fall back to local analysis.
      console.warn('Edge function invocation failed, falling back to local analysis:', error.message);
      return await localAnalyzeRedditUrl(url);
    }

    if (!data || !data.success) {
      // Non-success payload from edge function -> fallback
      console.warn('Edge function returned non-success payload, falling back to local analysis');
      return await localAnalyzeRedditUrl(url);
    }

    return data;
  } catch (err) {
    console.warn('Failed to invoke edge function, running local analysis instead.', err);
    return await localAnalyzeRedditUrl(url);
  }
};

/**
 * Local, client-side fallback analyzer for prototypes.
 * - Fetches the Reddit JSON for the provided URL (appending `.json`)
 * - Runs a very small, heuristic sentiment + entity extraction pass
 * - Returns the same response shape as the server function
 */
const localAnalyzeRedditUrl = async (url: string): Promise<AnalyzeSentimentResponse> => {
  try {
    // Normalize URL and append .json
    const normalized = url.endsWith('/') ? url.slice(0, -1) : url;
    const jsonUrl = normalized.endsWith('.json') ? normalized : `${normalized}.json`;

    const res = await fetch(jsonUrl, { method: 'GET' });
    if (!res.ok) {
      return { success: false, error: `Failed to fetch Reddit JSON (${res.status})` };
    }

    const payload = await res.json();

    // Reddit returns an array for posts pages; comments pages also
    const posts: Array<{ id?: string; title?: string; selftext?: string; body?: string; author?: string }> = [];

    // Try to extract common shapes (listing, comments)
    if (Array.isArray(payload)) {
      // Comments or post listing
      for (const part of payload) {
        if (part && part.data && Array.isArray(part.data.children)) {
          for (const child of part.data.children) {
            const d = child.data || {};
            posts.push({ id: d.id, title: d.title, selftext: d.selftext, body: d.body, author: d.author });
          }
        }
      }
    } else if (payload && payload.data && Array.isArray(payload.data.children)) {
      for (const child of payload.data.children) {
        const d = child.data || {};
        posts.push({ id: d.id, title: d.title, selftext: d.selftext, body: d.body, author: d.author });
      }
    }

    if (posts.length === 0) {
      return { success: false, postsFound: 0, postsAnalyzed: 0, error: 'No posts found in Reddit JSON' };
    }

    // Very small sentiment word lists for prototype
    const positive = new Set(['good', 'great', 'happy', 'love', 'awesome', 'excellent', 'nice', 'win', 'yay']);
    const negative = new Set(['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'fail', 'worse', 'loss']);

    const results: AnalyzeSentimentResponse['results'] = [];

    for (const p of posts.slice(0, 50)) {
      const text = [p.title, p.selftext, p.body].filter(Boolean).join(' ').toLowerCase();
      const words = text.split(/[^a-zA-Z]+/).filter(Boolean);
      let score = 0;
      for (const w of words) {
        if (positive.has(w)) score += 1;
        if (negative.has(w)) score -= 1;
      }

      const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
      const confidence = Math.min(0.95, Math.max(0.5, Math.abs(score) / Math.max(1, words.length)) + 0.5);

      // crude entity extraction: capitalized words of length > 2
      const entities: string[] = [];
      const entityMatches = text.match(/\b([A-Z][a-zA-Z]{2,})\b/g);
      if (entityMatches) {
        for (const e of entityMatches) {
          if (!entities.includes(e)) entities.push(e);
        }
      }

      results.push({ postId: p.id || '', sentiment, confidence, entities });
    }

    return {
      success: true,
      jobId: `local-${Date.now()}`,
      postsFound: posts.length,
      postsAnalyzed: results.length,
      results,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message || 'Local analysis failed' };
  }
};

/**
 * Analyze sentiment from raw text
 * Invokes the analyze-sentiment edge function
 */
export const analyzeText = async (
  text: string
): Promise<AnalyzeSentimentResponse> => {
  const { data, error } = await invokeFunction<AnalyzeSentimentResponse>(
    'analyze-sentiment',
    { text }
  );

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return data || { success: false, error: 'No response received' };
};

/**
 * Ask a natural language question about the sentiment data
 * Invokes the nl-query edge function
 */
export const askQuestion = async (
  request: NLQueryRequest
): Promise<NLQueryResponse> => {
  const { data, error } = await invokeFunction<NLQueryResponse>(
    'nl-query',
    request as unknown as Record<string, unknown>
  );

  if (error) {
    return {
      success: false,
      answer: '',
      sources: [],
      summary: {
        totalMentions: 0,
        positivePercent: 0,
        negativePercent: 0,
        neutralPercent: 0,
      },
      responseTimeMs: 0,
      error: error.message,
    };
  }

  return data || {
    success: false,
    answer: '',
    sources: [],
    summary: {
      totalMentions: 0,
      positivePercent: 0,
      negativePercent: 0,
      neutralPercent: 0,
    },
    responseTimeMs: 0,
    error: 'No response received',
  };
};

/**
 * Get sentiment color based on sentiment type
 */
export const getSentimentColor = (
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
): string => {
  const colors: Record<string, string> = {
    positive: '#10B981', // green
    negative: '#EF4444', // red
    neutral: '#6B7280',  // gray
    mixed: '#F59E0B',    // yellow
  };
  return colors[sentiment] || colors.neutral;
};

/**
 * Get sentiment emoji based on sentiment type
 */
export const getSentimentEmoji = (
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
): string => {
  const emojis: Record<string, string> = {
    positive: '😊',
    negative: '😞',
    neutral: '😐',
    mixed: '🤔',
  };
  return emojis[sentiment] || emojis.neutral;
};

/**
 * Format confidence score as percentage
 */
export const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

/**
 * Format sentiment score as percentage (-100% to +100%)
 */
export const formatSentimentScore = (score: number): string => {
  const percentage = Math.round(score * 100);
  return percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
};

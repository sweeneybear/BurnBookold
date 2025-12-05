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
  const { data, error } = await invokeFunction<AnalyzeSentimentResponse>(
    'analyze-sentiment',
    { url }
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

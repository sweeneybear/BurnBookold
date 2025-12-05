// BurnBook - TypeScript Type Definitions

export interface RedditPost {
  id: string;
  reddit_id: string;
  subreddit: string;
  title?: string;
  body?: string;
  author?: string;
  url: string;
  post_type: 'post' | 'comment';
  score: number;
  num_comments: number;
  created_utc: string;
  ingested_at: string;
}

export interface Entity {
  id: string;
  name: string;
  normalized_name: string;
  entity_type: 'company' | 'product' | 'feature';
  description?: string;
  aliases?: string[];
  created_at: string;
}

export interface SentimentAnalysis {
  id: string;
  post_id: string;
  entity_id: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  sentiment_score: number;
  key_phrases: string[];
  analysis_metadata?: Record<string, unknown>;
  analyzed_at: string;
}

export interface SentimentSummary {
  entity_id: string;
  entity_name: string;
  entity_type: 'company' | 'product' | 'feature';
  total_mentions: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  mixed_count: number;
  avg_sentiment_score: number;
  avg_confidence: number;
}

export interface IngestionJob {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  posts_found: number;
  posts_analyzed: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface NLQuery {
  id: string;
  question: string;
  answer?: string;
  context_entities?: string[];
  sources?: string[];
  tokens_used?: number;
  response_time_ms?: number;
  created_at: string;
}

// API Response Types
export interface AnalyzeSentimentRequest {
  url?: string;
  text?: string;
}

export interface AnalyzeSentimentResponse {
  success: boolean;
  jobId?: string;
  postsFound?: number;
  postsAnalyzed?: number;
  results?: Array<{
    postId: string;
    sentiment: string;
    confidence: number;
    entities: string[];
  }>;
  error?: string;
}

export interface NLQueryRequest {
  question: string;
  entityType?: 'company' | 'product' | 'feature';
  entityName?: string;
}

export interface NLQueryResponse {
  success: boolean;
  answer: string;
  sources: Array<{
    postId: string;
    title?: string;
    snippet: string;
    sentiment: string;
  }>;
  summary: {
    totalMentions: number;
    positivePercent: number;
    negativePercent: number;
    neutralPercent: number;
  };
  responseTimeMs: number;
  error?: string;
}

// Dashboard State Types
export interface DashboardFilters {
  entityType?: 'company' | 'product' | 'feature' | 'all';
  timeRange?: '7d' | '30d' | '90d' | 'all';
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed' | 'all';
}

export interface SentimentChartData {
  name: string;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
  total: number;
}

// Component Props Types
export interface SentimentBadgeProps {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  size?: 'sm' | 'md' | 'lg';
}

export interface EntityCardProps {
  entity: Entity;
  summary?: SentimentSummary;
  onClick?: () => void;
}

export interface PostCardProps {
  post: RedditPost;
  sentiment?: SentimentAnalysis;
  onClick?: () => void;
}

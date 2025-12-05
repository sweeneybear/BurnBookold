// BurnBook - Custom React Hooks for Sentiment Data

import { useState, useEffect, useCallback } from 'react';
import { supabase, subscribeToSentimentAnalysis, subscribeToIngestionJobs } from '../lib/supabase';
import type { 
  SentimentSummary, 
  IngestionJob, 
  Entity, 
  SentimentAnalysis,
  DashboardFilters 
} from '../types';

/**
 * Hook for fetching and managing sentiment summary data
 */
export const useSentimentSummary = (filters?: DashboardFilters) => {
  const [data, setData] = useState<SentimentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('sentiment_summary').select('*');

      if (filters?.entityType && filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType);
      }

      const { data: result, error: queryError } = await query.order('total_mentions', { ascending: false });

      if (queryError) throw queryError;
      setData(result || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters?.entityType]);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const subscription = subscribeToSentimentAnalysis(() => {
      fetchData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching entities
 */
export const useEntities = (type?: 'company' | 'product' | 'feature') => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setLoading(true);
        let query = supabase.from('entities').select('*');

        if (type) {
          query = query.eq('entity_type', type);
        }

        const { data, error: queryError } = await query.order('name');

        if (queryError) throw queryError;
        setEntities(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [type]);

  return { entities, loading, error };
};

/**
 * Hook for fetching recent sentiment analyses
 */
export const useRecentSentiment = (limit: number = 10) => {
  const [analyses, setAnalyses] = useState<Array<SentimentAnalysis & { 
    post: { title?: string; body?: string; subreddit: string };
    entity: { name: string; entity_type: string };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('sentiment_analysis')
        .select(`
          *,
          post:reddit_posts(title, body, subreddit),
          entity:entities(name, entity_type)
        `)
        .order('analyzed_at', { ascending: false })
        .limit(limit);

      if (queryError) throw queryError;
      setAnalyses(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();

    const subscription = subscribeToSentimentAnalysis(() => {
      fetchData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  return { analyses, loading, error, refetch: fetchData };
};

/**
 * Hook for managing ingestion jobs
 */
export const useIngestionJobs = () => {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('ingestion_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (queryError) throw queryError;
      setJobs(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();

    const subscription = subscribeToIngestionJobs(() => {
      fetchJobs();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
};

/**
 * Hook for dashboard filters
 */
export const useDashboardFilters = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    entityType: 'all',
    timeRange: '30d',
    sentiment: 'all',
  });

  const updateFilter = useCallback((
    key: keyof DashboardFilters,
    value: DashboardFilters[keyof DashboardFilters]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      entityType: 'all',
      timeRange: '30d',
      sentiment: 'all',
    });
  }, []);

  return { filters, updateFilter, resetFilters };
};

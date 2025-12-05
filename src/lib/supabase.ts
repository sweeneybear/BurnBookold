// BurnBook - Supabase Client Configuration

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    '⚠️ Supabase credentials not configured. The dashboard will show demo data only.\n' +
    'To connect to a real database, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Use placeholder values only for development/demo mode
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key, {
    auth: {
      // Disable auth for demo mode
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Helper function to invoke edge functions
export const invokeFunction = async <T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body as Record<string, unknown>,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
};

// Subscribe to realtime updates
export const subscribeToIngestionJobs = (
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
) => {
  return supabase
    .channel('ingestion-jobs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ingestion_jobs',
      },
      callback
    )
    .subscribe();
};

export const subscribeToSentimentAnalysis = (
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
) => {
  return supabase
    .channel('sentiment-analysis')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sentiment_analysis',
      },
      callback
    )
    .subscribe();
};

-- BurnBook Database Schema
-- Run this script in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- Reddit Posts Table
-- Stores raw Reddit posts/comments ingested from URLs
-- ============================================
CREATE TABLE IF NOT EXISTS reddit_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reddit_id TEXT UNIQUE NOT NULL,
    subreddit TEXT NOT NULL,
    title TEXT,
    body TEXT,
    author TEXT,
    url TEXT NOT NULL,
    post_type TEXT CHECK (post_type IN ('post', 'comment')),
    score INTEGER DEFAULT 0,
    num_comments INTEGER DEFAULT 0,
    created_utc TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    raw_json JSONB
);

-- Index for fast subreddit lookups
CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_created ON reddit_posts(created_utc DESC);

-- ============================================
-- Entities Table
-- Stores extracted companies, products, and features
-- ============================================
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('company', 'product', 'feature')) NOT NULL,
    description TEXT,
    aliases TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(normalized_name, entity_type)
);

-- Index for entity lookups
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities USING gin(name gin_trgm_ops);

-- ============================================
-- Sentiment Analysis Table
-- Stores AI-generated sentiment analysis results
-- ============================================
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES reddit_posts(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')) NOT NULL,
    confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    sentiment_score DECIMAL(5,4) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    key_phrases TEXT[],
    analysis_metadata JSONB,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, entity_id)
);

-- Indexes for sentiment queries
CREATE INDEX IF NOT EXISTS idx_sentiment_post ON sentiment_analysis(post_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_entity ON sentiment_analysis(entity_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_type ON sentiment_analysis(sentiment);

-- ============================================
-- Natural Language Queries Table
-- Stores user questions and AI responses
-- ============================================
CREATE TABLE IF NOT EXISTS nl_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT,
    context_entities UUID[],
    sources UUID[],
    tokens_used INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for query history
CREATE INDEX IF NOT EXISTS idx_nl_queries_created ON nl_queries(created_at DESC);

-- ============================================
-- Ingestion Jobs Table
-- Tracks Reddit URL ingestion status
-- ============================================
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    posts_found INTEGER DEFAULT 0,
    posts_analyzed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for job status tracking
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status);

-- ============================================
-- Dashboard Aggregates (Materialized View)
-- Pre-computed sentiment statistics for fast dashboard loading
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS sentiment_summary AS
SELECT 
    e.id AS entity_id,
    e.name AS entity_name,
    e.entity_type,
    COUNT(sa.id) AS total_mentions,
    SUM(CASE WHEN sa.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_count,
    SUM(CASE WHEN sa.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_count,
    SUM(CASE WHEN sa.sentiment = 'neutral' THEN 1 ELSE 0 END) AS neutral_count,
    SUM(CASE WHEN sa.sentiment = 'mixed' THEN 1 ELSE 0 END) AS mixed_count,
    AVG(sa.sentiment_score) AS avg_sentiment_score,
    AVG(sa.confidence) AS avg_confidence
FROM entities e
LEFT JOIN sentiment_analysis sa ON e.id = sa.entity_id
GROUP BY e.id, e.name, e.entity_type;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_sentiment_summary_entity ON sentiment_summary(entity_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_sentiment_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY sentiment_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Seed Data - Sample Entities
-- ============================================
INSERT INTO entities (name, normalized_name, entity_type, description, aliases) VALUES
    ('ImageTrend', 'imagetrend', 'company', 'ImageTrend Inc. - EMS and Fire software provider', ARRAY['IT', 'Image Trend']),
    ('Elite', 'elite', 'product', 'ImageTrend Elite - Patient care reporting software', ARRAY['Elite ePCR', 'Elite EMS']),
    ('RescueHub', 'rescuehub', 'product', 'RescueHub - Mobile app for first responders', ARRAY['Rescue Hub']),
    ('Mobile App', 'mobile_app', 'feature', 'Mobile application functionality', ARRAY['app', 'mobile', 'iOS', 'Android']),
    ('Reporting', 'reporting', 'feature', 'Report generation and analytics', ARRAY['reports', 'analytics', 'dashboards']),
    ('Offline Mode', 'offline_mode', 'feature', 'Ability to work without internet connection', ARRAY['offline', 'disconnected mode']),
    ('NEMSIS Compliance', 'nemsis', 'feature', 'NEMSIS data standard compliance', ARRAY['NEMSIS 3', 'NEMSIS export']),
    ('CAD Integration', 'cad_integration', 'feature', 'Computer-aided dispatch integration', ARRAY['CAD', 'dispatch'])
ON CONFLICT (normalized_name, entity_type) DO NOTHING;

-- ============================================
-- Row Level Security (Disabled for Demo)
-- ============================================
-- Note: RLS is disabled for demo purposes
-- In production, enable RLS and create appropriate policies

ALTER TABLE reddit_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE nl_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- ⚠️ DEMO POLICIES - REPLACE BEFORE PRODUCTION ⚠️
-- These policies allow unrestricted access for demo purposes.
-- For production, implement proper authentication and replace with:
-- CREATE POLICY "Authenticated users can read" ON table_name FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can insert own data" ON table_name FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Demo policies - allow all operations for anonymous users
CREATE POLICY "Allow all for demo" ON reddit_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for demo" ON entities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for demo" ON sentiment_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for demo" ON nl_queries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for demo" ON ingestion_jobs FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Realtime Configuration
-- Enable realtime updates for the dashboard
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE sentiment_analysis;
ALTER PUBLICATION supabase_realtime ADD TABLE ingestion_jobs;

-- ============================================
-- Sample Data for Testing
-- ============================================
INSERT INTO reddit_posts (reddit_id, subreddit, title, body, author, url, post_type, score, created_utc) VALUES
    ('demo1', 'ems', 'Anyone else using ImageTrend Elite?', 'Been using Elite for 3 months now. The mobile app has been a game changer for our crew. Offline mode works great!', 'firefighter_john', 'https://reddit.com/r/ems/demo1', 'post', 42, NOW() - INTERVAL '7 days'),
    ('demo2', 'ems', 'Re: ImageTrend Elite', 'Agreed! The reporting features saved us so much time on NEMSIS compliance.', 'medic_sarah', 'https://reddit.com/r/ems/demo2', 'comment', 15, NOW() - INTERVAL '6 days'),
    ('demo3', 'Firefighting', 'RescueHub review', 'RescueHub CAD integration has been problematic. Support helped but still having issues.', 'chief_mike', 'https://reddit.com/r/Firefighting/demo3', 'post', 28, NOW() - INTERVAL '3 days')
ON CONFLICT (reddit_id) DO NOTHING;

-- Link sample posts to sample sentiment analysis
INSERT INTO sentiment_analysis (post_id, entity_id, sentiment, confidence, sentiment_score, key_phrases)
SELECT 
    rp.id,
    e.id,
    CASE 
        WHEN rp.reddit_id = 'demo1' THEN 'positive'
        WHEN rp.reddit_id = 'demo2' THEN 'positive'
        ELSE 'mixed'
    END,
    CASE 
        WHEN rp.reddit_id IN ('demo1', 'demo2') THEN 0.92
        ELSE 0.75
    END,
    CASE 
        WHEN rp.reddit_id IN ('demo1', 'demo2') THEN 0.8
        ELSE -0.2
    END,
    CASE 
        WHEN rp.reddit_id = 'demo1' THEN ARRAY['game changer', 'offline mode works great']
        WHEN rp.reddit_id = 'demo2' THEN ARRAY['saved time', 'NEMSIS compliance']
        ELSE ARRAY['problematic', 'having issues']
    END
FROM reddit_posts rp
CROSS JOIN entities e
WHERE rp.reddit_id IN ('demo1', 'demo2', 'demo3')
AND (
    (rp.reddit_id = 'demo1' AND e.normalized_name IN ('elite', 'mobile_app', 'offline_mode'))
    OR (rp.reddit_id = 'demo2' AND e.normalized_name IN ('elite', 'reporting', 'nemsis'))
    OR (rp.reddit_id = 'demo3' AND e.normalized_name IN ('rescuehub', 'cad_integration'))
)
ON CONFLICT (post_id, entity_id) DO NOTHING;

-- Refresh the materialized view with initial data
REFRESH MATERIALIZED VIEW sentiment_summary;

-- ============================================
-- Useful Query Examples
-- ============================================

-- Get sentiment summary by entity type
-- SELECT * FROM sentiment_summary WHERE entity_type = 'product' ORDER BY total_mentions DESC;

-- Get recent negative mentions
-- SELECT rp.title, rp.body, e.name, sa.sentiment, sa.key_phrases
-- FROM sentiment_analysis sa
-- JOIN reddit_posts rp ON sa.post_id = rp.id
-- JOIN entities e ON sa.entity_id = e.id
-- WHERE sa.sentiment = 'negative'
-- ORDER BY rp.created_utc DESC
-- LIMIT 10;

-- Get trending topics (most mentioned in last 7 days)
-- SELECT e.name, e.entity_type, COUNT(*) as mentions
-- FROM sentiment_analysis sa
-- JOIN entities e ON sa.entity_id = e.id
-- JOIN reddit_posts rp ON sa.post_id = rp.id
-- WHERE rp.created_utc > NOW() - INTERVAL '7 days'
-- GROUP BY e.id
-- ORDER BY mentions DESC;

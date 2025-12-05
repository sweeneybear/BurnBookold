# BurnBook Configuration Status

## Current Setup Summary

### ✅ What's Ready

1. **Front-end App**
   - React + TypeScript dashboard
   - Reddit URL input component
   - Sentiment visualization
   - Real-time updates

2. **Environment Variables** (Already in `.env.local`)
   ```
   VITE_SUPABASE_URL=https://ldlaljwckqvdmoqbsdto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_AZURE_AI_ENDPOINT=https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project
   VITE_AZURE_AI_KEY=ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG
   ```

3. **Supabase Project**
   - Project ID: `ldlaljwckqvdmoqbsdto`
   - Database ready
   - Auth configured

4. **Azure AI Credentials**
   - Endpoint: Already configured
   - API Key: Already configured
   - Ready to use for sentiment analysis

5. **Edge Functions**
   - `analyze-sentiment`: Fetches Reddit posts and analyzes sentiment using Azure AI
   - `nl-query`: Natural language queries about sentiment data
   - Code updated to support Azure AI Foundry format

### ⏳ What You Need To Do

**Just one thing:** Deploy the edge functions to Supabase

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-id ldlaljwckqvdmoqbsdto

# 4. Set Azure credentials as secrets
supabase secrets set AZURE_AI_ENDPOINT="https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project"
supabase secrets set AZURE_AI_KEY="ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG"

# 5. Deploy the functions
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query

# 6. Start your app
npm run dev
```

Then test it:
1. Open http://localhost:3002
2. Go to "📥 Ingest Data" tab
3. Paste: `https://reddit.com/r/ems`
4. Click "Analyze"
5. You should see: "✅ Found X posts, analyzed Y"

## Architecture Overview

```
BurnBook Frontend (React)
        ↓
   Supabase Client SDK
        ↓
   Supabase Edge Functions
        ↓
   Azure AI Language Service (Sentiment Analysis)
        ↓
   Supabase PostgreSQL Database
        ↓
   Real-time Updates back to Frontend
```

## Files Structure

```
BurnBook/
├── src/
│   ├── components/
│   │   ├── RedditUrlInput.tsx     ← Where you paste Reddit URLs
│   │   ├── SentimentDashboard.tsx ← Shows all sentiment data
│   │   ├── SentimentChart.tsx     ← Visualizes sentiment
│   │   └── NaturalLanguageQuery.tsx ← Ask questions about data
│   ├── lib/
│   │   ├── azure-ai.ts           ← Client-side Azure AI utilities
│   │   └── supabase.ts           ← Supabase client config
│   ├── pages/
│   │   └── Dashboard.tsx         ← Main app page
│   └── types/
│       └── index.ts              ← TypeScript types
├── supabase/
│   ├── functions/
│   │   ├── analyze-sentiment/    ← ⭐ Edge function that does the work
│   │   │   └── index.ts          ← Fetches Reddit → Calls Azure → Stores data
│   │   └── nl-query/             ← Edge function for questions
│   │       └── index.ts
│   └── migrations/
│       └── 001_initial_schema.sql ← Database schema
├── .env.local                     ← Your credentials (already filled in!)
├── AZURE_SETUP.md                 ← Detailed Azure setup
├── REDDIT_AZURE_SETUP.md          ← This integration guide
└── QUICKSTART.md                  ← Quick start guide
```

## What Happens When You Analyze a Reddit URL

1. **Frontend**: You paste a URL and click "Analyze"
2. **Supabase**: Frontend calls `analyze-sentiment` edge function
3. **Edge Function**:
   - Fetches all posts from that Reddit URL (using Reddit's JSON API)
   - For each post, calls Azure AI to analyze sentiment
   - Extracts entities (companies, products, features)
   - Stores everything in PostgreSQL database
   - Updates job status: pending → processing → completed
4. **Database**: Stores:
   - Reddit posts (title, body, subreddit, etc.)
   - Sentiment analysis (sentiment, confidence, score)
   - Entities (companies, products, features mentioned)
5. **Frontend**: Automatically updates dashboard with new data in real-time

## Data Flow Example

**You**: Paste `https://reddit.com/r/ems`

**Edge Function gets posts like**:
```
Post 1: "ImageTrend Elite is awesome!"
Post 2: "The offline mode is broken"
Post 3: "RescueHub mobile app is great"
```

**Azure AI analyzes each**:
```
Post 1: sentiment=positive, entities=[ImageTrend, Elite, awesome]
Post 2: sentiment=negative, entities=[offline_mode, broken]
Post 3: sentiment=positive, entities=[RescueHub, mobile_app]
```

**Stored in database**:
- `sentiment_analysis` table: 3 rows (sentiment + confidence for each)
- `entities` table: 6 unique entities
- `reddit_posts` table: 3 posts
- `sentiment_summary` view: Auto-calculated stats

**Dashboard shows**:
- ImageTrend: 1 positive mention
- RescueHub: 1 positive mention
- Offline Mode: 1 negative mention
- Overall sentiment: 67% positive

## Configuration Files

### `.env.local` (Client-side)
Used by the React app running in your browser. Currently has:
- Supabase URLs and keys
- Azure AI endpoint and key (for local dev)

### Supabase Secrets (Server-side)
Used by edge functions running on Supabase servers. You'll set these via CLI:
```bash
supabase secrets set AZURE_AI_ENDPOINT="..."
supabase secrets set AZURE_AI_KEY="..."
```

### `supabase/config.json`
Supabase project configuration. Update with your project ID:
```json
{
  "projectId": "ldlaljwckqvdmoqbsdto"
}
```

## Running Locally

### Dev Server
```bash
npm run dev
# Opens http://localhost:3002
# Hot-reload enabled
```

### Production Build
```bash
npm run build
# Creates dist/ folder
# Minified and optimized
```

### Type Checking
```bash
npm run lint
# Checks for TypeScript errors
```

## Monitoring Your System

### Check Edge Function Status
```bash
supabase functions logs analyze-sentiment --tail
# Shows real-time logs from edge function
```

### View Job History
In Supabase dashboard SQL editor:
```sql
SELECT * FROM ingestion_jobs ORDER BY created_at DESC LIMIT 10;
```

### View Sentiment Analysis
```sql
SELECT * FROM sentiment_analysis LIMIT 20;
```

### View Entities
```sql
SELECT * FROM entities WHERE entity_type = 'company';
```

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| "Edge Function returned non-2xx" | Run `supabase functions deploy analyze-sentiment` |
| No posts found | Check Reddit URL format (must start with https://) |
| Azure AI errors | Verify API key and endpoint in Supabase secrets |
| App won't start | Run `npm install` then `npm run dev` |
| Sentiment looks wrong | Could be using mock analysis (falls back if Azure fails) |
| Dashboard empty | Analyze a Reddit URL first (it populates the database) |

## Next Steps

### Immediate (Right now)
1. ✅ Deploy edge functions
2. ✅ Test with Reddit URL
3. ✅ Verify sentiment analysis works

### Short-term (Today)
1. Try analyzing different subreddits
2. Monitor the edge function logs
3. Check database for stored data

### Medium-term (This week)
1. Integrate into your workflow
2. Setup monitoring/alerts
3. Customize entities to track

### Long-term (This month)
1. Deploy to production
2. Setup authentication
3. Add automated ingestion
4. Setup OpenAI for better NL queries

## Support Resources

- **Quick Start**: `QUICKSTART.md`
- **Deployment**: `DEPLOYMENT.md`
- **Azure Setup**: `AZURE_SETUP.md`
- **Reddit + Azure**: `REDDIT_AZURE_SETUP.md` (← Start here)
- **Edge Function Errors**: `EDGE_FUNCTION_ERROR.md`
- **Current Config**: This file (CONFIG.md)

## Questions?

Check the docs in this order:
1. `REDDIT_AZURE_SETUP.md` - Most relevant for your use case
2. `AZURE_SETUP.md` - For Azure-specific issues
3. `DEPLOYMENT.md` - For deployment questions
4. `EDGE_FUNCTION_ERROR.md` - For technical errors

# BurnBook Deployment Guide

## Prerequisites

1. Supabase account (https://supabase.com)
2. Supabase CLI installed: `npm install -g supabase`
3. Git CLI installed

## Setup Steps

### 1. Create a Supabase Project

1. Go to https://supabase.com and create a new project
2. Note your Project ID, Project URL, and Anon Key
3. Create a Service Role Key in Project Settings > API

### 2. Update Environment Variables

Update `.env.local` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Deploy the Database Schema

1. Go to your Supabase dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Open and copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the query editor and click "Run"

This will create all required tables, views, and functions.

### 4. Deploy Edge Functions

Edge functions need to be deployed to Supabase. You have two options:

#### Option A: Deploy via Supabase CLI (Recommended for Local Development)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-id your-project-id

# Deploy the edge functions
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query
```

#### Option B: Deploy via Supabase Dashboard

1. In your Supabase dashboard, go to Functions > Create a new function
2. Name it `analyze-sentiment`
3. Copy the contents of `supabase/functions/analyze-sentiment/index.ts` into the editor
4. Click "Deploy"
5. Repeat for `nl-query` function

### 5. Set Edge Function Environment Variables

In Supabase Dashboard > Functions > Settings:

Add these secrets (if using Azure AI - optional for demo):
- `AZURE_AI_ENDPOINT`: Your Azure AI Language endpoint
- `AZURE_AI_KEY`: Your Azure AI API key

If these are not set, the functions will use mock sentiment analysis (perfect for testing).

### 6. Update Supabase Config (Optional)

Update `supabase/config.json` with your project ID:

```json
{
  "projectId": "your-project-id",
  "functions": {
    "analyze-sentiment": {
      "verifyJWT": false
    },
    "nl-query": {
      "verifyJWT": false
    }
  }
}
```

### 7. Start the App

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3002` (or another port if 3002 is in use).

## Troubleshooting

### "Edge Function returned a non-2xx status code"

This typically means:
1. The edge function is not deployed - run `supabase functions deploy analyze-sentiment`
2. The edge function has an error - check logs in Supabase dashboard > Functions > Logs
3. Missing environment variables - add `AZURE_AI_ENDPOINT` and `AZURE_AI_KEY` if using Azure AI

### To view edge function logs:

```bash
supabase functions download analyze-sentiment
supabase functions logs analyze-sentiment
```

### No data appearing in dashboard

1. Make sure the database schema is deployed (check step 3)
2. Try analyzing a Reddit URL - this will populate the database
3. Check that the ingestion job completed (should show in the "Ingest Data" tab)

### Functions run but return empty results

The functions have mock sentiment analysis built-in as a fallback. This means they will work even without Azure AI configured. The mock analysis uses keyword matching, so try URLs with common sentiment words like "great", "awesome", "bad", "terrible", etc.

## Demo Mode

The app includes a full demo mode with mock data:
- Mock sentiment analysis (uses keyword matching)
- Mock entity extraction
- Mock NLP responses

This means you can fully test the app without Azure AI credentials configured!

## Production Considerations

Before deploying to production:

1. **Enable Row Level Security (RLS)**: Replace demo RLS policies with proper authentication
2. **Configure Azure AI**: Set up Azure Language API for production-grade sentiment analysis
3. **Setup Authentication**: Configure Supabase Auth for user management
4. **Enable HTTPS**: Deploy behind a reverse proxy with SSL
5. **Rate Limiting**: Add rate limits to prevent abuse
6. **Monitoring**: Set up error tracking and performance monitoring

## Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase CLI: https://supabase.com/docs/guides/local-development
- Azure Language API: https://azure.microsoft.com/en-us/products/cognitive-services/language-service/

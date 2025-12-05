# BurnBook Edge Function Error - Resolution

## Problem

When trying to analyze a Reddit URL, the app shows: **"Edge Function returned a non-2xx status code"**

## Root Cause

The error occurs because the Supabase Edge Functions (`analyze-sentiment` and `nl-query`) are **not deployed** to your Supabase project. Edge functions are cloud functions that run on Supabase's infrastructure and are not available locally.

## Solution

### Quick Fix: Deploy the Edge Functions

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project** (find your project ID in Supabase dashboard):
   ```bash
   supabase link --project-id your-project-id
   ```

4. **Deploy the functions**:
   ```bash
   supabase functions deploy analyze-sentiment
   supabase functions deploy nl-query
   ```

5. **Set environment variables** (optional, for Azure AI):
   - Go to your Supabase dashboard
   - Navigate to Functions > Settings
   - Add secrets: `AZURE_AI_ENDPOINT` and `AZURE_AI_KEY`
   - If not set, the functions will use mock sentiment analysis

### Alternative: Deploy via Supabase Dashboard

1. Go to your Supabase dashboard
2. Click **Functions** in the left menu
3. Click **Create a new function**
4. Name it `analyze-sentiment`
5. Copy the code from `supabase/functions/analyze-sentiment/index.ts`
6. Paste into the editor and click **Deploy**
7. Repeat for `nl-query` function

## Database Setup Required

Before the edge functions can work, you need to set up the database schema:

1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run**

This creates all the necessary tables, views, and functions.

## Verification

After deploying:

1. Refresh the app in your browser
2. Try analyzing a Reddit URL (e.g., https://reddit.com/r/ems)
3. You should see: "Found X posts, analyzed Y" instead of the error

## What If It Still Fails?

Check the function logs:

```bash
supabase functions logs analyze-sentiment
```

This will show you the actual error from the cloud function.

Common issues:
- **Function not found**: Make sure `supabase functions deploy` was successful
- **Database connection error**: Verify the database schema was deployed
- **Missing entities**: Make sure sample entities were inserted (see schema migration)

## Demo Mode

Good news: The app has built-in fallback to mock sentiment analysis! Even if the edge functions fail, you can still:
- Test the UI with demo data
- Try the text analysis feature (doesn't require Reddit URLs)
- See how the dashboard works with sample data

The mock analysis will:
- Fetch Reddit posts successfully
- Perform keyword-based sentiment analysis
- Extract entities (using keyword matching)
- Store everything in the database

This is perfect for local development and testing!

## See Also

- Full deployment guide: `DEPLOYMENT.md`
- Environment setup: Check `.env.local` file
- Configuration: `supabase/config.json`

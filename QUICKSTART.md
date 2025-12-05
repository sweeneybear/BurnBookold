# BurnBook Quick Start Guide

## What You Need

- **Supabase project** (free at https://supabase.com)
- **Node.js 18+** (already installed)
- **Supabase CLI** (for deploying functions)

## Step 1: Get Your Supabase Credentials

1. Create a free project at https://supabase.com
2. Go to Project Settings > API
3. Copy your:
   - Project URL
   - Anon Key
   - Service Role Key

## Step 2: Update Environment Variables

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Setup Database

1. In Supabase dashboard, go to **SQL Editor**
2. Create new query
3. Copy entire content of `supabase/migrations/001_initial_schema.sql`
4. Run the query

This creates tables, views, and sample data!

## Step 4: Deploy Edge Functions

The app needs two cloud functions to work:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-id your-project-id

# Deploy functions
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query
```

## Step 5: Start the App

```bash
npm install
npm run dev
```

The app will open at `http://localhost:3002` (or next available port).

## What's Working Now?

✅ Dashboard with sample data  
✅ Analyzing Reddit URLs  
✅ Text sentiment analysis  
✅ Natural language queries  
✅ Real-time updates  

## Features

### 📊 Dashboard Tab
- View sentiment statistics
- See entity breakdown (companies, products, features)
- Track sentiment trends

### 📥 Ingest Data Tab
- Paste Reddit subreddit, post, or user URLs
- App analyzes sentiment of all posts
- Results stored in database and shown on dashboard

### 💬 Ask Questions Tab
- Ask natural language questions about your data
- Examples:
  - "What do users think about the mobile app?"
  - "Which features are getting negative feedback?"
  - "Compare sentiment across all products"

## Sample Reddit URLs to Try

```
https://reddit.com/r/ems           # Subreddit
https://reddit.com/user/username    # User profile
https://reddit.com/r/ems/comments/abc123/...  # Specific post
```

## Entities Tracked (Sample Data)

- **Companies**: ImageTrend
- **Products**: Elite, RescueHub
- **Features**: Mobile App, Offline Mode, CAD Integration, Reporting, NEMSIS Compliance

## Troubleshooting

### App won't start?
```bash
npm install
npm run dev
```

### "Edge Function returned non-2xx status"?
- Make sure you ran `supabase functions deploy`
- Check logs: `supabase functions logs analyze-sentiment`
- See `EDGE_FUNCTION_ERROR.md` for detailed help

### No data in dashboard?
1. Check that database schema was deployed
2. Try analyzing a Reddit URL
3. Wait a moment for the ingestion to complete

### Everything failing?
The app has **demo/mock mode** built-in! Even if edge functions fail, you can:
- See sample data in the dashboard
- Test the UI
- Try the text analysis feature

## Next Steps

- Read `DEPLOYMENT.md` for production setup
- Configure Azure AI (optional) for better sentiment analysis
- Enable authentication for multi-user deployment
- Set up proper Row Level Security (RLS)

## Need Help?

- Supabase Docs: https://supabase.com/docs
- BurnBook Repo Issues: Check GitHub repository
- Check `EDGE_FUNCTION_ERROR.md` for common issues

## Demo Features

Even without full setup, you can:
- ✅ View the dashboard with sample data
- ✅ See sentiment analysis in action
- ✅ Test the UI/UX
- ✅ Try the mock sentiment analysis

The mock analysis uses keyword-based sentiment detection - try analyzing text with words like "great", "terrible", "love", "hate", etc.

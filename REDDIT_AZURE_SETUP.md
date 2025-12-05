# Complete Setup: Reddit URL + Azure AI Foundry

This guide shows you exactly how to connect Reddit URL analysis with Azure AI Foundry.

## What You're Getting

✅ Reddit URL ingestion (subreddit, posts, user profiles)  
✅ Sentiment analysis powered by Azure AI  
✅ Entity extraction and key phrases  
✅ Database storage of all posts and analysis  
✅ Real-time dashboard updates  

## Your Setup Status

### ✅ Already Done
- Environment variables configured in `.env.local`
- BurnBook app structure ready
- Database schema available
- Edge functions prepared with Azure AI support

### ⏳ What You Need To Do

1. Create Azure Language Service
2. Deploy edge functions to Supabase
3. Test Reddit URL analysis

## Quick Setup (5 minutes)

### 1. Create Azure Language Service

```bash
# Option A: Via Azure Portal (Easiest)
# Go to https://portal.azure.com
# 1. Search "Language" resource
# 2. Click Create
# 3. Select your subscription/region
# 4. Choose "Standard" pricing tier
# 5. Copy the Endpoint and Key
```

**Your credentials from `.env.local`:**
```
Endpoint: https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project
Key: ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG
```

### 2. Deploy to Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login to your Supabase account
supabase login

# Link your Supabase project
supabase link --project-id your-project-id

# Set Azure credentials as edge function secrets
supabase secrets set AZURE_AI_ENDPOINT="https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project"
supabase secrets set AZURE_AI_KEY="ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG"

# Deploy the edge functions
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query
```

### 3. Test It Works

```bash
# Start the app
npm run dev
```

Then in your browser:
1. Go to http://localhost:3002
2. Click "📥 Ingest Data" tab
3. Paste a Reddit URL: `https://reddit.com/r/ems`
4. Click "Analyze"
5. Should see: "✅ Found X posts, analyzed Y"

## How It Works (Technical Overview)

```
Reddit URL
    ↓
[BurnBook App]
    ↓
[Supabase Edge Function: analyze-sentiment]
    ↓
[Fetch Reddit Posts]
    ↓
[Send to Azure AI Language Service]
    ↓
[Get: Sentiment + Entities + Key Phrases]
    ↓
[Store in Supabase Database]
    ↓
[Dashboard Updates in Real-Time]
```

## What Gets Extracted

For each Reddit post, Azure AI provides:

### Sentiment Analysis
- **Sentiment**: positive, negative, neutral, or mixed
- **Confidence**: 0-1 (how sure Azure is)
- **Sentiment Score**: -1 to +1 (how positive/negative)

Example: "The mobile app is amazing!" 
→ Sentiment: positive, Confidence: 0.97

### Key Phrases
Automatically extracted important phrases

Example: From "The ImageTrend Elite mobile app has great offline mode"
→ Phrases: ["ImageTrend Elite", "mobile app", "offline mode"]

### Named Entities
Identifies companies, products, features

Example: From "ImageTrend Elite is great for EMS reporting"
→ Entities: ["ImageTrend" (company), "Elite" (product), "EMS reporting" (feature)]

## Troubleshooting

### Problem: "Edge Function returned non-2xx status"

**Solution**:
1. Verify edge functions are deployed:
   ```bash
   supabase functions list
   ```

2. Check edge function logs:
   ```bash
   supabase functions logs analyze-sentiment
   ```

3. Verify secrets are set:
   ```bash
   supabase secrets list
   ```

### Problem: "No posts found"

**Likely Cause**: Reddit URL format incorrect

**Solution**: Use these formats:
- ✅ `https://reddit.com/r/ems` - Subreddit
- ✅ `https://reddit.com/r/ems/comments/abc123/...` - Specific post
- ✅ `https://reddit.com/user/username` - User profile
- ❌ `reddit.com/r/ems` - Missing https://
- ❌ `https://www.reddit.com/...` - Use reddit.com, not www

### Problem: "403 Forbidden" from Azure

**Likely Cause**: Wrong API key or endpoint

**Solution**:
1. Go to Azure Portal
2. Find your Language Service resource
3. Click "Keys and Endpoint"
4. Copy the correct key and endpoint
5. Update in Supabase:
   ```bash
   supabase secrets set AZURE_AI_ENDPOINT="your-correct-endpoint"
   supabase secrets set AZURE_AI_KEY="your-correct-key"
   ```

### Problem: Azure AI returns errors, but app keeps working

**This is normal!** BurnBook has automatic fallback:
- If Azure AI fails: Uses mock sentiment analysis
- Data is still stored (just with mock analysis)
- Check logs to see what went wrong
- App keeps working either way

## What Each Tab Does

### 📊 Dashboard
- Shows all sentiment summaries
- Breakdown by entity type (companies, products, features)
- Overall sentiment statistics
- Sample data if no posts ingested yet

### 📥 Ingest Data
- Paste Reddit URLs (subreddits, posts, users)
- See ingestion progress
- View status of recent jobs
- Failed jobs show error messages

### 💬 Ask Questions
- Natural language queries about sentiment data
- Examples:
  - "What do users think about the mobile app?"
  - "Which product has best sentiment?"
  - "Compare sentiment across products"
- Powered by Azure OpenAI (if configured)

## Next: Azure OpenAI for NL Questions (Optional)

To enable the "Ask Questions" feature with real AI:

1. Create Azure OpenAI resource
2. Deploy a gpt-35-turbo model
3. Set environment variables:
   ```
   VITE_AZURE_OPENAI_ENDPOINT=...
   VITE_AZURE_OPENAI_KEY=...
   VITE_AZURE_OPENAI_DEPLOYMENT_ID=...
   ```
4. Deploy the `nl-query` edge function

For now, the questions feature uses mock responses but shows the UI.

## Database Tables

All data goes into Supabase PostgreSQL:

- `reddit_posts` - Raw Reddit posts/comments
- `entities` - Companies, products, features
- `sentiment_analysis` - Analysis results
- `ingestion_jobs` - Track analysis runs
- `nl_queries` - Store questions and answers
- `sentiment_summary` - Pre-computed statistics (materialized view)

Query the database directly:
```bash
supabase db pull  # Get current schema
```

## Monitoring & Logs

### View Sentiment Analysis Logs
```bash
supabase functions logs analyze-sentiment --tail
```

### View Job Status
In the app:
1. Go to "📥 Ingest Data" tab
2. Scroll to "Recent Ingestion Jobs"
3. See status: pending → processing → completed/failed

### Check Database
In Supabase dashboard:
1. Go to SQL Editor
2. Run:
   ```sql
   SELECT * FROM ingestion_jobs ORDER BY created_at DESC;
   SELECT * FROM sentiment_analysis LIMIT 10;
   ```

## Performance Tips

- **First run**: 30-60 seconds (depends on post count)
- **Typical subreddit**: 50-200 posts analyzed
- **Sentiment analysis**: ~100ms per post with Azure AI

## Cost Breakdown (Monthly)

### Azure Language Service
- Free tier: 5,000 records/month
- Standard: ~$10-20 for typical usage

### Supabase
- Free tier: Includes everything you need
- Pro: $25/month for higher limits

### Total monthly cost
- **Starting**: Free (if under limits)
- **Light use**: $5-15
- **Heavy use**: $20-50

## Next Steps

1. ✅ Create Azure Language Service (if not done)
2. ✅ Deploy edge functions to Supabase
3. ✅ Test with a Reddit URL
4. 📊 Analyze multiple subreddits
5. 🔍 Use dashboard to spot trends
6. 💬 (Optional) Setup Azure OpenAI for questions

## Common Questions

**Q: Can I change which entities are tracked?**  
A: Yes, edit the seed data in `supabase/migrations/001_initial_schema.sql` and redeploy.

**Q: Can I analyze non-English Reddit posts?**  
A: Yes, Azure AI supports 120+ languages automatically.

**Q: How often should I ingest data?**  
A: You can run manual ingestion as often as you want. No automatic scheduling yet.

**Q: Can I delete old analysis data?**  
A: Yes, via Supabase dashboard or SQL queries.

**Q: Is my data private?**  
A: Data stored in Supabase (your account). Analysis sent to Azure AI (Microsoft's service).

## Support

- BurnBook Docs: See `QUICKSTART.md`, `DEPLOYMENT.md`
- Azure Setup: See `AZURE_SETUP.md`
- Edge Function Error: See `EDGE_FUNCTION_ERROR.md`
- GitHub: https://github.com/sweeneybear/BurnBookold

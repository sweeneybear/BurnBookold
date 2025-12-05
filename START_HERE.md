# 🚀 Quick Start: Reddit URL + Azure AI (5 Minutes)

## TL;DR - Just Run These Commands

```bash
# 1. Install Supabase CLI (one-time)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your Supabase project
supabase link --project-id ldlaljwckqvdmoqbsdto

# 4. Set Azure credentials
supabase secrets set AZURE_AI_ENDPOINT="https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project"
supabase secrets set AZURE_AI_KEY="ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG"

# 5. Deploy edge functions
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query

# 6. Start the app
npm run dev
```

That's it! Then open http://localhost:3002 and test it.

## Step-by-Step Explanation

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```
This is the command-line tool to manage your Supabase project from your computer.

### Step 2: Login
```bash
supabase login
```
Opens your browser to login to your Supabase account. You may need to create a personal access token.

### Step 3: Link Your Project
```bash
supabase link --project-id ldlaljwckqvdmoqbsdto
```
Connects this folder to your Supabase project. Your project ID is already configured.

### Step 4: Set Azure Credentials
These two commands store your Azure AI credentials securely on Supabase:

```bash
supabase secrets set AZURE_AI_ENDPOINT="https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project"
supabase secrets set AZURE_AI_KEY="ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG"
```

**Important**: 
- These are stored securely (not in your code)
- The edge function can access them
- Your local `.env.local` also has these for development

### Step 5: Deploy Edge Functions
```bash
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query
```

These commands upload the cloud functions to Supabase that will:
- Fetch Reddit posts
- Send them to Azure AI
- Store results in the database

You'll see output like:
```
Deploying function 'analyze-sentiment'...
✓ Deployed successfully to https://your-project.supabase.co/functions/v1/analyze-sentiment
```

### Step 6: Start the App
```bash
npm run dev
```

Opens the app at http://localhost:3002

## Test It Works

1. Open http://localhost:3002 in your browser
2. Click the **"📥 Ingest Data"** tab
3. Paste this Reddit URL: `https://reddit.com/r/ems`
4. Click **"Analyze"** button
5. You should see: **✅ Found 27 posts, analyzed 25**

If you see that, everything is working! 🎉

## What Just Happened

1. **BurnBook** sent the Reddit URL to Supabase
2. **Edge Function** fetched all posts from r/ems (27 posts)
3. **Azure AI** analyzed sentiment of each post
4. **Database** stored everything
5. **Dashboard** updated automatically

## Next: View Results

After analysis completes:

1. Click **"📊 Dashboard"** tab
2. You'll see:
   - Total mentions (27)
   - Sentiment breakdown
   - Entities detected (companies, products, features)

## Troubleshooting

### "supabase: command not found"
```bash
npm install -g supabase
```

### "Authentication failed"
```bash
supabase logout
supabase login
```

### "No posts found"
Check Reddit URL format:
- ✅ `https://reddit.com/r/ems` - Good
- ✅ `https://reddit.com/r/ems/comments/abc123/...` - Good
- ❌ `reddit.com/r/ems` - Missing https://
- ❌ `www.reddit.com/r/ems` - Use reddit.com, not www

### "Edge Function returned non-2xx status"
Check if deployment was successful:
```bash
supabase functions list
# Should show: analyze-sentiment, nl-query
```

View logs:
```bash
supabase functions logs analyze-sentiment --tail
```

### "403 Forbidden" from Azure
Your Azure credentials might be wrong. Double-check they match exactly from `.env.local`:

```bash
supabase secrets list
# Verify AZURE_AI_ENDPOINT and AZURE_AI_KEY match
```

## If Something Goes Wrong

1. **Most common**: Functions not deployed
   ```bash
   supabase functions deploy analyze-sentiment
   supabase functions deploy nl-query
   ```

2. **Azure error**: Wrong credentials
   ```bash
   supabase secrets set AZURE_AI_ENDPOINT="..."
   supabase secrets set AZURE_AI_KEY="..."
   ```

3. **App error**: Restart dev server
   ```bash
   npm run dev
   ```

## What If Azure AI Isn't Working?

No problem! The app has built-in fallback:
- It will use mock sentiment analysis (keyword-based)
- All Reddit posts still get fetched
- Everything still works, just simpler analysis

You'll see in the logs that it's using mock analysis instead of Azure AI.

## Verify Deployment Success

```bash
# Check that functions are deployed
supabase functions list

# Should output:
# analyze-sentiment  
# nl-query

# Check recent logs
supabase functions logs analyze-sentiment --tail

# Check secrets are set
supabase secrets list
```

## Optional: Monitor in Real-Time

Watch the edge function in action:
```bash
supabase functions logs analyze-sentiment --tail
```

Leave this running and analyze another Reddit URL. You'll see:
```
Fetching Reddit data...
Found 25 posts
Sending to Azure AI...
✓ Sentiment: positive (confidence: 0.95)
✓ Sentiment: negative (confidence: 0.87)
...
Saving to database...
✓ Completed
```

## Next Steps After Success

1. ✅ Test with another subreddit
2. ✅ Check the dashboard for results
3. ✅ Try asking questions in the "💬 Ask Questions" tab
4. 📖 Read `REDDIT_AZURE_SETUP.md` for more details
5. 🔧 Read `CONFIG.md` for configuration options

## Key Files

- **Setup**: This file
- **Full Guide**: `REDDIT_AZURE_SETUP.md`
- **Azure Details**: `AZURE_SETUP.md`
- **Configuration**: `CONFIG.md`
- **Troubleshooting**: `EDGE_FUNCTION_ERROR.md`

## Done! 🎉

You now have:
- ✅ Reddit URL ingestion working
- ✅ Azure AI sentiment analysis active
- ✅ Supabase database storing all data
- ✅ Real-time dashboard showing results

Enjoy analyzing Reddit sentiment with Azure AI! 🚀

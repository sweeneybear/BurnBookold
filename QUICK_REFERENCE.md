# 🎯 Quick Reference Card

## Deploy & Test (Copy-Paste)

```bash
# Step 1: Install CLI
npm install -g supabase

# Step 2: Login
supabase login

# Step 3: Link project
supabase link --project-id ldlaljwckqvdmoqbsdto

# Step 4: Set secrets
supabase secrets set AZURE_AI_ENDPOINT="https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project"
supabase secrets set AZURE_AI_KEY="ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG"

# Step 5: Deploy
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query

# Step 6: Start app
npm run dev

# Step 7: Test
# Open http://localhost:3002
# Paste: https://reddit.com/r/ems
# Click Analyze
```

## Common Commands

```bash
# View edge function logs
supabase functions logs analyze-sentiment --tail

# List deployed functions
supabase functions list

# Check secrets are set
supabase secrets list

# Redeploy a function
supabase functions deploy analyze-sentiment --force

# Start development server
npm run dev

# Build for production
npm run build

# Check for errors
npm run lint
```

## Supported Reddit URLs

```
✅ https://reddit.com/r/ems
✅ https://reddit.com/r/ems/comments/abc123/title
✅ https://reddit.com/user/username
❌ reddit.com/r/ems (missing https://)
❌ https://www.reddit.com/r/ems (use reddit.com, not www)
```

## Expected Output

When analyzing `https://reddit.com/r/ems`:

```
✅ Found 25 posts, analyzed 23

Dashboard will show:
- Total Mentions: 25
- Sentiment breakdown: 60% positive, 20% negative, 20% neutral
- Top entities mentioned
- Key phrases detected
```

## Dashboard Tabs

| Tab | Purpose |
|-----|---------|
| 📊 Dashboard | View all sentiment statistics |
| 📥 Ingest Data | Paste Reddit URLs to analyze |
| 💬 Ask Questions | Ask AI about the data |

## File Locations

| File | Purpose |
|------|---------|
| `src/components/RedditUrlInput.tsx` | Reddit URL input form |
| `supabase/functions/analyze-sentiment/index.ts` | Edge function (does the work) |
| `src/pages/Dashboard.tsx` | Main dashboard page |
| `.env.local` | Your credentials |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Edge Function returned non-2xx" | Run `supabase functions deploy analyze-sentiment` |
| "No posts found" | Check Reddit URL format (must start with https://) |
| "403 Forbidden" | Verify Azure credentials with `supabase secrets list` |
| "supabase: command not found" | Run `npm install -g supabase` |
| App won't start | Run `npm install` then `npm run dev` |

## What Gets Stored

For each Reddit post analyzed:

```
reddit_posts table:
- Reddit ID
- Title & body
- Subreddit
- Score & comments
- URL

sentiment_analysis table:
- Sentiment (positive/negative/neutral/mixed)
- Confidence score (0-1)
- Sentiment score (-1 to +1)
- Key phrases
- Analyzed timestamp

entities table:
- Entity name
- Entity type (company/product/feature)
- Normalized name
```

## Azure AI Features Used

- ✅ Sentiment Analysis (4 classes)
- ✅ Key Phrase Extraction
- ✅ Named Entity Recognition
- ✅ Opinion Mining
- ✅ Multiple language support

## Performance

| Operation | Time |
|-----------|------|
| Fetch Reddit posts | 2-5 sec |
| Analyze sentiment (per post) | 100-300ms |
| Store in database | 50-100ms |
| Total for 25 posts | 30-60 sec |

## Documentation Map

```
START_HERE.md
  ↓
REDDIT_AZURE_SETUP.md
  ↓
Either:
  - AZURE_SETUP.md (Azure questions)
  - CONFIG.md (Configuration)
  - EDGE_FUNCTION_ERROR.md (Technical issues)
```

## Architecture in 30 Seconds

```
┌─────────────────────┐
│  React Dashboard    │
│  (Your browser)     │
└──────────┬──────────┘
           │ Paste URL
           ↓
┌─────────────────────┐
│  Supabase Edge Fn   │
│  (Cloud server)     │
└──────────┬──────────┘
           │ Fetch posts
           ↓
┌─────────────────────┐
│  Reddit API         │
│  (25 posts)         │
└──────────┬──────────┘
           │ Analyze
           ↓
┌─────────────────────┐
│  Azure AI Language  │
│  (Sentiment, etc)   │
└──────────┬──────────┘
           │ Save
           ↓
┌─────────────────────┐
│  PostgreSQL DB      │
│  (Store results)    │
└──────────┬──────────┘
           │ Update
           ↓
┌─────────────────────┐
│  Dashboard          │
│  (Shows insights)   │
└─────────────────────┘
```

## Success Checklist

- [ ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Project linked
- [ ] Secrets set (AZURE_AI_*)
- [ ] Functions deployed
- [ ] Dev server running
- [ ] Can paste Reddit URL
- [ ] Analysis completes
- [ ] Dashboard shows data

## Quick Help

**What to do first**: Read `START_HERE.md`

**Still stuck?**:
1. Copy the 6 commands above
2. Run them one by one
3. Check `supabase functions logs analyze-sentiment --tail`
4. Read `EDGE_FUNCTION_ERROR.md` if issues

**Questions about Azure?**: Read `AZURE_SETUP.md`

**Configuration details?**: Read `CONFIG.md`

---

**TL;DR**: Run 6 commands, refresh your browser, paste Reddit URL, done! 🎉

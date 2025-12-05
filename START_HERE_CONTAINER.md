# 🚀 START HERE: Deploy Functions & Test

## ⚠️ Important: Dev Container Limitation

This dev container cannot install Supabase CLI via npm. But **no worries!** You have **2 simple options**:

## 🎯 Option 1: Dashboard Deployment (5 Minutes, No CLI)

### Easiest & Recommended!

**Step 1: Open Supabase Dashboard**
- Go to: https://app.supabase.com
- Select project: `ldlaljwckqvdmoqbsdto`

**Step 2: Deploy analyze-sentiment Function**
1. Click "Functions" in left sidebar
2. Click "Create function"
3. Name it: `analyze-sentiment`
4. In your editor, open: `supabase/functions/analyze-sentiment/index.ts`
5. Copy ALL the code
6. Paste into the Supabase editor
7. Click "Deploy"

**Step 3: Deploy nl-query Function**
1. Click "Create function"
2. Name it: `nl-query`
3. Open: `supabase/functions/nl-query/index.ts`
4. Copy ALL the code
5. Paste into the Supabase editor
6. Click "Deploy"

**Step 4: Set Environment Variables**
1. Go to Functions → Settings
2. Click "Add secret" twice and add:

```
Secret 1:
  Name: AZURE_AI_ENDPOINT
  Value: https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project

Secret 2:
  Name: AZURE_AI_KEY
  Value: ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG
```

**Step 5: Test It!**
```bash
npm run dev
```
- Open http://localhost:3002
- Click "📥 Ingest Data" tab
- Paste: `https://reddit.com/r/ems`
- Click "Analyze"
- You should see: **✅ Found 25 posts, analyzed 23**

Done! 🎉

---

## 💻 Option 2: CLI Deployment (From Your Local Machine)

If you have a local terminal with Supabase CLI installed:

```bash
# On your local computer:
cd /path/to/BurnBookold

supabase login
supabase link --project-id ldlaljwckqvdmoqbsdto
supabase secrets set AZURE_AI_ENDPOINT="https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project"
supabase secrets set AZURE_AI_KEY="ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG"
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query
```

Then return to dev container:
```bash
npm run dev
```

---

## 🔍 How to Test After Deployment

### In the App:
1. Open http://localhost:3002
2. Click **"📥 Ingest Data"** tab
3. Paste a Reddit URL:
   - `https://reddit.com/r/ems`
   - `https://reddit.com/r/Firefighting`
   - `https://reddit.com/user/some_username`
4. Click **"Analyze"**
5. Watch it work! ✨

### Expected Output:
```
✅ Found 25 posts, analyzed 23
```

### View Results:
1. Click **"📊 Dashboard"** tab
2. See sentiment breakdown
3. View entities detected

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Functions not showing | Refresh browser or wait 30 seconds |
| "No posts found" | Check URL format (must start with https://) |
| "403 Forbidden" | Verify Azure secrets in Supabase settings |
| Empty dashboard | Analyze a Reddit URL first to populate data |

---

## ⚡ What Happens When You Analyze:

1. **App** sends Reddit URL to Supabase
2. **Edge Function** fetches all posts
3. **Azure AI** analyzes sentiment of each post
4. **Database** stores everything
5. **Dashboard** updates in real-time

---

## 📚 Documentation

- **Deployment Issues**: See `DEPLOY_FUNCTIONS.md`
- **All the Options**: See `DEPLOY_FUNCTIONS.md` Options 1-4
- **Full Setup Guide**: See `REDDIT_AZURE_SETUP.md`
- **Configuration**: See `CONFIG.md`
- **Troubleshooting**: See `EDGE_FUNCTION_ERROR.md`

---

## ✅ Success Checklist

- [ ] Functions deployed (via dashboard or CLI)
- [ ] Azure secrets set in Supabase
- [ ] `npm run dev` running
- [ ] Can paste Reddit URL
- [ ] Analysis completes
- [ ] Dashboard shows data

---

**Ready? Start with Option 1 above! ⬆️**

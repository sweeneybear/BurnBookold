# 📖 Detailed Dashboard Deployment Guide

This guide shows exactly what to click in the Supabase Dashboard.

## Prerequisites

- Supabase account (you already have one)
- Project ID: `ldlaljwckqvdmoqbsdto`
- This repository open in your editor

## Step 1: Go to Supabase Dashboard

**URL**: https://app.supabase.com

1. Log in if needed
2. You should see your projects
3. Click on project: `ldlaljwckqvdmoqbsdto`

## Step 2: Navigate to Functions

In the left sidebar, look for "Functions" or "Edge Functions" and click it.

You should see a page that says "Functions" with a blue "Create function" button.

## Step 3: Create analyze-sentiment Function

1. Click **"Create function"** button
2. A form appears asking for:
   - **Name**: Type `analyze-sentiment`
   - Click **"Create function"** again

3. A code editor opens

## Step 4: Copy Function Code

**In your code editor** (where you see this repo):

1. Open file: `supabase/functions/analyze-sentiment/index.ts`
2. Select ALL the code (Ctrl+A or Cmd+A)
3. Copy (Ctrl+C or Cmd+C)

## Step 5: Paste Into Supabase

**In the Supabase editor**:

1. Clear any existing code (Select all, delete)
2. Paste the code you copied (Ctrl+V or Cmd+V)
3. You should see the full edge function code

## Step 6: Deploy Function

1. Look for a **"Deploy"** button (usually top right)
2. Click it
3. Wait for success message
4. You should see: "✓ Deployed successfully" or similar

## Step 7: Repeat for nl-query Function

1. Click "Create function" again
2. Name: `nl-query`
3. Click "Create function"
4. Open: `supabase/functions/nl-query/index.ts` in your editor
5. Copy all code
6. Paste into Supabase
7. Click "Deploy"

## Step 8: Set Environment Variables (Secrets)

**In Supabase Dashboard**:

1. Go to **Functions** → **Settings** (or look for settings gear icon)
2. Look for "Secrets" or "Environment Variables" section
3. Click **"Add secret"** (or "New secret")

### Add First Secret:

```
Name: AZURE_AI_ENDPOINT
Value: https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project
```

Click "Add secret"

### Add Second Secret:

```
Name: AZURE_AI_KEY
Value: ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG
```

Click "Add secret"

## Step 9: Verify Deployment

1. Go back to **Functions** page
2. You should see two functions listed:
   - `analyze-sentiment`
   - `nl-query`

3. Both should have a green indicator showing they're active

## Step 10: Test in the App

**In the dev container**:

```bash
npm run dev
```

This opens http://localhost:3002

### Test Steps:

1. Click **"📥 Ingest Data"** tab
2. You see a form with "Reddit URL" input
3. Paste: `https://reddit.com/r/ems`
4. Click **"Analyze"** button
5. Wait (it might take 30-60 seconds)
6. You should see: **✅ Found X posts, analyzed Y**

If you see that message, **SUCCESS!** 🎉

## Viewing Results

After a successful analysis:

1. Click **"📊 Dashboard"** tab
2. You'll see:
   - Total mentions
   - Sentiment breakdown (positive/negative/neutral)
   - Entities detected
   - Charts and statistics

## Troubleshooting During Deployment

### Problem: Can't find Functions section
- Look in the left sidebar
- It might be under "Developer" or "Integrations"
- If still can't find it, try refreshing the page

### Problem: "Deploy" button is greyed out
- Make sure you have code in the editor
- Check for red error indicators
- Try refreshing the page

### Problem: Functions show but "Analyze" doesn't work
- Secrets might not be set correctly
- Double-check values match exactly
- Make sure both functions are deployed

### Problem: Analysis runs but returns error
- Check edge function logs (Functions → Logs)
- Verify Azure credentials are correct
- Try with a different Reddit URL

## Checking Edge Function Logs

If something goes wrong during analysis:

1. Go to **Functions** page
2. Click on **analyze-sentiment** function
3. Look for **"Logs"** tab at the bottom
4. You'll see recent executions and errors
5. This helps diagnose what went wrong

## Next Steps

After successful deployment:

1. ✅ Try different Reddit URLs
2. ✅ Check the dashboard
3. ✅ Monitor the logs
4. ✅ Read `REDDIT_AZURE_SETUP.md` for more features

## Need More Help?

- **Can't find the button**: Try refreshing the Supabase dashboard
- **Code won't paste**: Make sure you're in the code editor box
- **Function won't deploy**: Check for syntax errors in the code
- **Analysis fails**: Check logs in Functions → Logs
- **Still stuck**: See `DEPLOY_FUNCTIONS.md` for all options

## Common Questions

**Q: How do I know if functions are deployed?**
A: Go to Functions page and you should see them listed with a green indicator.

**Q: Can I edit the code after deployment?**
A: Yes, you can click on the function and edit it, then deploy again.

**Q: What if I make a mistake setting secrets?**
A: Go to Functions → Settings and update the secret value, then redeploy.

**Q: Do I need to deploy every time I make changes?**
A: Only if you change the function code. Changing secrets doesn't require redeployment.

**Q: How long does deployment take?**
A: Usually 10-30 seconds. If it takes longer, check for errors.

---

**Good luck!** Follow these steps and you'll have Reddit sentiment analysis with Azure AI running! 🚀
